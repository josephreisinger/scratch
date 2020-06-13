import React from 'react';
import moment from 'moment';
import {
    RichUtils,
    ContentState,
    DraftEditorCommand,
    DraftHandleValue,
    EditorState,
    convertFromRaw,
    getDefaultKeyBinding,
    KeyBindingUtil,
    RawDraftContentState,
} from 'draft-js';
import PluginEditor from 'draft-js-plugins-editor';
import createListPlugin from 'draft-js-list-plugin';

import { randomEmoji } from './randomEmoji';

import './BlockEditor.css';

const listPlugin = createListPlugin({ maxDepth: 100 });
const plugins = [listPlugin];

export type Block = {
    key: string;
    title?: string;
    creator: string;
    createdAt: number;
    contentState: RawDraftContentState;
};

type Props = {
    block: Block;
    onUpdateBlock: (block: Block, newContentState: ContentState) => void;
    onCreateNewBlock: (title: string) => void;
    onDeleteBlock: (block: Block) => void;
    shouldFocus: boolean;
};

export const BlockEditor: React.FC<Props> = React.memo((props: Props) => {
    const [editorState, setEditorState] = React.useState(
        EditorState.createWithContent(convertFromRaw(props.block.contentState))
    );

    const editor = React.useRef<PluginEditor>(null);

    const handleKeyCommand = (command: DraftEditorCommand, oldState: EditorState): DraftHandleValue => {
        console.log(command);
        const newState = RichUtils.handleKeyCommand(oldState, command);
        if (newState) {
            setEditorState(newState);
            return 'handled';
        }
        return 'not-handled';
    };

    const keyBindingFn = (event: any) => {
        console.log('KC', event.keyCode);
        // we press CTRL + K => return 'bbbold'
        // we use hasCommandModifier instead of checking for CTRL keyCode because different OSs have different command keys
        if (KeyBindingUtil.hasCommandModifier(event) && event.keyCode === 13) {
            props.onCreateNewBlock(randomEmoji());
            return null;
        }
        // manages usual things, like:
        // Ctrl+Z => return 'undo'
        return getDefaultKeyBinding(event);
    };

    const onChange = (editorState: EditorState) => {
        setEditorState(editorState);
        props.onUpdateBlock(props.block, editorState.getCurrentContent());
    };

    const focusEditor = () => {
        if (editor && editor.current) {
            editor.current.focus();
        }
    };

    React.useEffect(() => {
        if (props.shouldFocus) {
            focusEditor();
        }
    }, []);

    return (
        <div className="block-container">
            <div className="meta">
                <div className="title">{props.block.key}</div>
                <div className="timestamp">{moment(props.block.createdAt).fromNow()}</div>
                <span className="delete" onMouseDown={() => props.onDeleteBlock(props.block)}>
                    X
                </span>
            </div>
            <div className="block" onClick={focusEditor}>
                <PluginEditor
                    ref={editor}
                    plugins={plugins}
                    editorState={editorState}
                    onChange={onChange}
                    handleKeyCommand={handleKeyCommand}
                    keyBindingFn={keyBindingFn}
                />
            </div>
        </div>
    );
});
