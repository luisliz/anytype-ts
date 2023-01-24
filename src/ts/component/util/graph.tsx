import * as React from 'react';
import * as ReactDOM from 'react-dom';
import $ from 'jquery';
import * as d3 from 'd3';
import { observer } from 'mobx-react';
import { PreviewObject } from 'Component';
import { I, Util, DataUtil, SmileUtil, FileUtil, translate, Relation } from 'Lib';
import { commonStore, blockStore } from 'Store';

interface Props {
	isPopup?: boolean;
	rootId: string;
	data: any;
	onClick?: (object: any) => void;
	onContextMenu?: (id: string, param: any) => void;
	onSelect?: (id: string) => void;
};

const Graph = observer(class Graph extends React.Component<Props> {

	node: any = null;
	canvas: any = null;
	edges: any[] = [];
	nodes: any[] = [];
	worker: any = null;
	images: any = {};
	subject: any = null;
	isDragging = false;
	isPreview = false;
	isPreviewDisabled = false;
	ids: string[] = [];
	timeoutPreview = 0;

	constructor (props: Props) {
		super(props);

		this.onMessage = this.onMessage.bind(this);
		this.nodeMapper = this.nodeMapper.bind(this);
	};

	render () {
		const { isPopup } = this.props;
		const id = [ 'graph' ];

		if (isPopup) {
			id.push('popup');
		};

		return (
			<div 
				ref={node => this.node = node} 
				id="graphWrapper"
			>
				<div id={id.join('-')} />
			</div>
		);
	};

	componentDidMount () {
		this.rebind();
	};

	componentWillUnmount () {
		if (this.worker) {
			this.worker.terminate();
		};

		$('body').removeClass('cp');
		this.unbind();
		this.onPreviewHide();
	};

	rebind () {
		const win = $(window);

		this.unbind();
		win.on('updateGraphSettings', () => { this.updateSettings(); });
		win.on('updateGraphRoot', (e: any, data: any) => { this.setRootId(data.id); });
	};

	unbind () {
		$(window).off('updateGraphSettings updateGraphRoot');
	};

	init () {
		const { data, isPopup } = this.props;
		const node = $(this.node);
		const density = window.devicePixelRatio;
		const elementId = '#graph' + (isPopup ? '-popup' : '');
		const transform: any = {};
		const width = node.width();
		const height = node.height();
		const zoom = d3.zoom().scaleExtent([ 1, 6 ]).on('zoom', e => this.onZoom(e));
		const scale = transform.k || 5;
		const x = transform.x || -width * 2;
		const y = transform.y || -height * 2;

		this.edges = (data.edges || []).map(this.edgeMapper);
		this.nodes = (data.nodes || []).map(this.nodeMapper);

		this.canvas = d3.select(elementId).append('canvas')
		.attr('width', (width * density) + 'px')
		.attr('height', (height * density) + 'px')
		.node();

		const transfer = node.find('canvas').get(0).transferControlToOffscreen();

		this.worker = new Worker('workers/graph.js');
		this.worker.onerror = (e: any) => { console.log(e); };
		this.worker.addEventListener('message', (data: any) => { this.onMessage(data); });

		this.send('init', { 
			canvas: transfer, 
			width,
			height,
			density,
			nodes: this.nodes,
			edges: this.edges,
			theme: commonStore.getThemeClass(),
			settings: commonStore.graph,
		}, [ transfer ]);

		d3.select(this.canvas)
        .call(d3.drag().
			subject(() => { return this.subject; }).
			on('start', (e: any, d: any) => this.onDragStart(e)).
			on('drag', (e: any, d: any) => this.onDragMove(e)).
			on('end', (e: any, d: any) => this.onDragEnd(e))
		)
        .call(zoom)
		.call(zoom.transform, d3.zoomIdentity.translate(x, y).scale(scale))
		.on('click', (e: any) => {
			const [ x, y ] = d3.pointer(e);
			this.send(e.shiftKey ? 'onSelect' : 'onClick', { x, y });
		})
		.on('contextmenu', (e: any) => {
			const [ x, y ] = d3.pointer(e);
			this.send('onContextMenu', { x, y });
		})
		.on('mousemove', (e: any) => {
			const [ x, y ] = d3.pointer(e);
			this.send('onMouseMove', { x, y });
		});
	};

	nodeMapper (d: any) {
		const { rootId } = this.props;

		d.layout = Number(d.layout) || 0;
		d.radius = 5;
		d.isRoot = d.id == rootId;
		d.src = this.imageSrc(d);

		if (d.layout == I.ObjectLayout.Note) {
			d.name = d.snippet || translate('commonEmpty');
		} else {
			d.name = d.name || DataUtil.defaultName('page');
		};

		d.name = SmileUtil.strip(d.name);
		d.shortName = Util.shorten(d.name, 24);

		// Clear icon props to fix image size
		if (d.layout == I.ObjectLayout.Task) {
			d.iconImage = '';
			d.iconEmoji = '';
		};

		if (!this.images[d.src]) {
			const img = new Image();

			img.onload = () => {
				if (this.images[d.src]) {
					return;
				};

				createImageBitmap(img, { resizeWidth: 160, resizeQuality: 'high' }).then((res: any) => {
					if (this.images[d.src]) {
						return;
					};

					this.images[d.src] = true;
					this.send('image', { src: d.src, bitmap: res });
				});
			};
			img.crossOrigin = '';
			img.src = d.src;
		};

		return d;
	};

	edgeMapper (d: any) {
		d.type = Number(d.type) || 0;
		d.typeName = translate('edgeType' + d.type);
		return d;
	};

	updateSettings () {
		this.send('updateSettings', commonStore.graph);
	};

	onDragStart (e: any) {
		this.isDragging = true;
		this.send('onDragStart', { active: e.active });

		$('body').addClass('grab');
	};

	onDragMove (e: any) {
		const p = d3.pointer(e, d3.select(this.canvas));
		const node = $(this.node);
		const { left, top } = node.offset();

		this.send('onDragMove', { 
			subjectId: this.subject.id, 
			active: e.active, 
			x: p[0] - left, 
			y: p[1] - top,
		});
	};
			
	onDragEnd (e: any) {
		this.isDragging = false;
		this.subject = null;
		this.send('onDragEnd', { active: e.active });

		$('body').removeClass('grab');
	};

	onZoom ({ transform }) {
		this.send('onZoom', { transform: transform });
  	};

	onPreviewShow (data: any) {
		if (this.isPreviewDisabled || !this.subject) {
			return;
		};

		const { isPopup } = this.props;
		const win = $(window);
		const body = $('body');
		const container = Util.getPageContainer(isPopup);
		const { left, top } = container.offset();
		const x = data.x + left + 10;
		const y = data.y + top + 10 - win.scrollTop();

		let el = $('#graphPreview');
		if (!el.length) {
			el = $('<div id="graphPreview" />');
			ReactDOM.render(<PreviewObject rootId={this.subject.id} />, el.get(0));
		};

		el.css({ left: x, top: y });
		body.append(el);

		this.isPreview = true;
	};

	onPreviewHide () {
		if (!this.isPreview) {
			return;
		};

		window.clearTimeout(this.timeoutPreview);
		$('#graphPreview').remove();
	};

	onMessage ({ data }) {
		const { root } = blockStore;
		const { isPopup, onClick, onContextMenu, onSelect } = this.props;

		switch (data.id) {
			case 'onClick':
				onClick(data.node);
				window.clearTimeout(this.timeoutPreview);
				break;

			case 'onSelect':
				if (data.node != root) {
					onSelect(data.node);
				};
				break;

			case 'onMouseMove':
				if (!this.isDragging) {
					this.subject = this.nodes.find(d => d.id == data.node);

					const body = $('body');

					if (this.subject) {
						window.clearTimeout(this.timeoutPreview);
						this.timeoutPreview = window.setTimeout(() => { this.onPreviewShow(data); }, 300);

						body.addClass('cp');
					} else {
						this.onPreviewHide();	
						body.removeClass('cp');
					};
				};
				break;

			case 'onDragMove':
				this.onPreviewHide();
				break;

			case 'onContextMenu':
				if (!data.node || (data.node == root)) {
					break;
				};

				this.onPreviewHide();

				onContextMenu(data.node, {
					onOpen: () => {
						this.isPreviewDisabled = true;
					},
					onClose: () => {
						this.isPreviewDisabled = false;
					},
					recalcRect: () => { 
						const rect = { width: 0, height: 0, x: data.x, y: data.y };

						if (isPopup) {
							const container = Util.getPageContainer(isPopup);
							const { left, top } = container.offset();

							rect.x += left;
							rect.y += top;
						};

						return rect;
					},
				});
				break;

		};
	};

	imageSrc (d: any) {
		let src = '';

		if (d.id == blockStore.root) {
			return 'img/icon/home-big.svg';
		};

		switch (d.layout) {
			case I.ObjectLayout.Relation:
				src = `img/icon/relation/big/${Relation.typeName(d.relationFormat)}.svg`;
				break;

			case I.ObjectLayout.Task:
				src = `img/icon/graph/task.svg`;
				break;

			case I.ObjectLayout.File:
				src = `img/icon/file/${FileUtil.icon(d)}.svg`;
				break;

			case I.ObjectLayout.Image:
				if (d.id) {
					src = commonStore.imageUrl(d.id, 160);
				} else {
					src = `img/icon/file/${FileUtil.icon(d)}.svg`;
				};
				break;
				
			case I.ObjectLayout.Human:
				src = d.iconImage ? commonStore.imageUrl(d.iconImage, 160) : '';
				break;

			case I.ObjectLayout.Note:
				break;

			case I.ObjectLayout.Bookmark:
				src = commonStore.imageUrl(d.iconImage, 24);
				break;
				
			default:
				if (d.iconImage) {
					src = commonStore.imageUrl(d.iconImage, 160);
				} else
				if (d.iconEmoji) {
					const data = SmileUtil.data(d.iconEmoji);
					if (data) {
						src = SmileUtil.srcFromColons(data.colons, data.skin);
					};
					src = src.replace(/^.\//, '');
				};
				break;
		};

		return src;
	};

	setRootId (id: string) {
		this.send('onSetRootId', { rootId: id });
	};

	send (id: string, param: any, transfer?: any[]) {
		if (this.worker) {
			this.worker.postMessage({ id: id, ...param }, transfer);
		};
	};

	resize () {
		const node = $(this.node);

		this.send('onResize', { 
			width: node.width(), 
			height: node.height(), 
			density: window.devicePixelRatio,
		});
	};

});

export default Graph;