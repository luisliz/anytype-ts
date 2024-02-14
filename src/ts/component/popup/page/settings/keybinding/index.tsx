import * as React from 'react';
import {Title, Label, Select, Button, Icon, Switch} from 'Component';
import {I, UtilDate, Storage, translate, analytics, Action} from 'Lib';
import {commonStore} from 'Store';
import {observer} from 'mobx-react';
import Shortcut from 'Component/popup/shortcut';
import {keybindingStore} from 'Store/keybinding';

const PopupSettingsPageKeybindingIndex = observer(class PopupSettingsPageKeybindingIndex extends React.Component<I.PopupSettings> {

    render() {
        const {vimMode} = keybindingStore;

        return (
            <React.Fragment>
                <Title text={translate('popupSettingsKeyBindingTitle')}/>

                <div className="actionItems">
                    <div className="item">
                        <Label text={translate('popupSettingsKeyBindingVimMode')}/>
                        <Switch className="big" value={vimMode}
                                onChange={v => keybindingStore.vimModeSet(v)}/>
                    </div>
                </div>
            </React.Fragment>
        );
    };
});

export default PopupSettingsPageKeybindingIndex;
