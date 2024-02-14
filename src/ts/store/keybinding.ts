import { action, computed, intercept, makeObservable, observable, set } from 'mobx';
import Constant from 'json/constant.json';
import $ from 'jquery';
import { I, Storage, UtilCommon, UtilObject, Renderer } from 'Lib';
import { dbStore } from 'Store';
import {is} from 'electron-util';

interface Keybind {
	from: number;
	text: string;
};

class KeybindingStore {
	public vimMode = false;
    constructor() {
        makeObservable(this, {
			vimMode: observable,
			vimModeSet: action,
		});
    };

	get vimObject(): boolean {
		return this.boolGet('vimObject');
	};

	boolGet (k: string) {
		const tk = `${k}Value`;
		if (this[tk] === null) {
			this[tk] = Storage.get(k);
		};
		return !!this[tk];
	};

	boolSet (k: string, v: boolean) {
		v = Boolean(v);

		this[`${k}Value`] = v;
		Storage.set(k, v);
	};


	vimModeSet (isVimOn: boolean) {
		this.vimMode = isVimOn;
	};
};

export const keybindingStore: KeybindingStore = new KeybindingStore();
