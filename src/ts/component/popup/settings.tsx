import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Icon, IconUser, Switch, Button, Title, Label, Cover, Textarea, Input } from 'ts/component';
import { I, Storage, Key } from 'ts/lib';
import { observer, inject } from 'mobx-react';

const $ = require('jquery');
const Constant: any = require('json/constant.json');

interface Props extends I.Popup {
	history: any;
	commonStore?: any;
	authStore?: any;
};

interface State {
	page: string;
};

@inject('commonStore')
@inject('authStore')
@observer
class PopupSettings extends React.Component<Props, {}> {

	phraseRef: any = null;
	refObj: any = {};
	state = {
		page: 'index'
	};
	
	constructor (props: any) {
		super(props);
		
		this.onClose = this.onClose.bind(this);
		this.onPage = this.onPage.bind(this);
		this.onCover = this.onCover.bind(this);
		this.onLogout = this.onLogout.bind(this);
		this.onFocusPhrase = this.onFocusPhrase.bind(this);
		this.onFocusPin = this.onFocusPin.bind(this);
		this.onBlurPin = this.onBlurPin.bind(this);
		this.onChangePin = this.onChangePin.bind(this);
	};
	
	render () {
		const { authStore, commonStore } = this.props;
		const { account } = authStore;
		const { cover } = commonStore;
		const { page } = this.state;
		
		let content = null;
		let inputs = [];
		
		switch (page) {
			
			default:
			case 'index':
				content = (
					<div>
						<Icon className="close" onClick={this.onClose} />
						<Title text="Settings" />
						
						<div className="rows">
							<div className="row" onClick={() => { this.onPage('wallpaper'); }}>
								<Icon className="wallpaper" />
								<Label text="Wallpaper" />
								<Icon className="arrow" />
							</div>
							
							<div className="row" onClick={() => { this.onPage('phrase'); }}>
								<Icon className="phrase" />
								<Label text="Keychain phrase" />
								<Icon className="arrow" />
							</div>
							
							<div className="row" onClick={() => { this.onPage('pinSelect'); }}>
								<Icon className="pin" />
								<Label text="Pin code" />
								<Icon className="arrow" />
							</div>
							
							<div className="row flex">
								<div className="side left">
									<Icon className="notify" />
									<Label text="Notifications" />
								</div>
								<div className="side right">
									<div className="switches">
										<div className="item">
											<div className="name">Updates</div>
											<Switch value={true} />
										</div>
										<div className="item">
											<div className="name">New invites</div>
											<Switch />
										</div>
									</div>
								</div>
							</div>
						</div>
						
						<div className="logout" onClick={this.onLogout}>Log out</div>
					</div>
				);
				break;
				
			case 'wallpaper':
				let covers = [];
				for (let i = 1; i <= 7; ++i) {
					covers.push({ id: i });
				};
				
				const Item = (item: any) => (
					<div className={'item ' + (item.active ? 'active': '')} onClick={() => { this.onCover(item.id); }}>
						<Cover num={item.id} />
					</div>
				);
				
				content = (
					<div>
						<Icon className="back" onClick={() => { this.onPage('index'); }} />
						<Title text="Wallpaper" />
						
						<div className="covers">
							{covers.map((item: any, i: number) => (
								<Item key={i} {...item} active={item.id == cover} />
							))}
						</div>
					</div>
				);
				break;
				
			case 'phrase':
				content = (
					<div>
						<Icon className="back" onClick={() => { this.onPage('index'); }} />
						<Title text="Keychain phrase" />
						<Label text="Your Keychain phrase protects your account. You’ll need it to sign in if you don’t have access to your devices. Keep it in a safe place." />
						<div className="inputs">
							<Textarea ref={(ref: any) => this.phraseRef = ref} value={authStore.phrase} onFocus={this.onFocusPhrase} placeHolder="witch collapse practice feed shame open despair creek road again ice least lake tree young address brain envelope" />
						</div>
						<Button text="I've written it down" className="orange" onClick={() => { this.onPage('index'); }} />
					</div>
				);
				break;
				
			case 'pinSelect':
				inputs = [];
				for (let i = 1; i <= Constant.pinSize; ++i) {
					inputs.push({ id: i });
				};
			
				content = (
					<div>
						<Icon className="back" onClick={() => { this.onPage('index'); }} />
						<Title text="Pin code" />
						<Label text="The pin code will protect your secret phrase. As we do not store your secret phrase or pin code and do not ask your e-mail or phone number, there is no id recovery without your pin code or secret phrase. So, please, remember your pin code." />
						<div className="inputs">
							{inputs.map((item: any, i: number) => (
								<Input ref={(ref: any) => this.refObj[item.id] = ref} maxLength={1} key={i} onFocus={(e) => { this.onFocusPin(e, item.id); }} onBlur={(e) => { this.onBlurPin(e, item.id); }} onKeyUp={(e: any) => { this.onChangePin(e, item.id); }} />
							))}
						</div>
						<Button text="Confirm" className="orange" onClick={() => { this.onPage('index'); }} />
					</div>
				);
				break;
				
			case 'pinConfirm':
				inputs = [];
				for (let i = 1; i <= Constant.pinSize; ++i) {
					inputs.push({ id: i });
				};
			
				content = (
					<div>
						<Icon className="back" onClick={() => { this.onPage('index'); }} />
						<Title text="Pin code" />
						<Label text="To continue, first verify that it's you. Enter your pin code" />
						<div className="inputs">
							{inputs.map((item: any, i: number) => (
								<Input ref={(ref: any) => this.refObj[item.id] = ref} maxLength={1} key={i} onFocus={(e) => { this.onFocusPin(e, item.id); }} onBlur={(e) => { this.onBlurPin(e, item.id); }} onKeyUp={(e: any) => { this.onChangePin(e, item.id); }} />
							))}
						</div>
						<Button text="Confirm" className="orange" onClick={() => { this.onPage('index'); }} />
					</div>
				);
				break;
				
		};
		
		return (
			<div className={page}>
				{content}
			</div>
		);
	};
	
	onFocusPhrase (e: any) {
		this.phraseRef.select();
	};
	
	onFocusPin (e: any, id: number) {
		this.refObj[id].addClass('active');
	};
	
	onBlurPin (e: any, id: number) {
		this.refObj[id].removeClass('active');
	};
	
	onChangePin (e: any, id: number) {
		const { authStore, history } = this.props;
		
		let k = e.which;
		let input = this.refObj[id];
		let prev = this.refObj[id - 1];
		let next = this.refObj[id + 1];
		let v = input.getValue();
		
		input.setType(input.getValue() ? 'password' : 'text');
		
		if ((k == Key.backSpace) && prev) {
			prev.setValue('');
			prev.setType('text');
			prev.focus();
		} else 
		if (v && next) {
			next.focus();	
		};
		
		let pin = this.getPin();
		if (pin.length == Constant.pinSize) {
		};			
	};
	
	getPin () {
		let c: string[] = [];
		for (let i in this.refObj) {
			c.push(this.refObj[i].getValue());
		};
		return c.join('');
	};
	
	onClose () {
		const { commonStore, id } = this.props;
		commonStore.popupClose(id);
	};
	
	onPage (id: string) {
		this.setState({ page: id });
	};
	
	onCover (id: number) {
		const { commonStore } = this.props;
		commonStore.coverSet(id);
	};
	
	onLogout (e: any) {
		const { authStore, history } = this.props;
		
		authStore.logout();
		history.push('/');
	};
	
};

export default PopupSettings;