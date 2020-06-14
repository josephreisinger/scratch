import React from 'react';
import moment from 'moment';
import useInterval from '@use-it/interval';
import {
    KeyBindingUtil,
    RichUtils,
    ContentState,
    DraftEditorCommand,
    DraftHandleValue,
    EditorState,
    convertFromRaw,
    getDefaultKeyBinding,
    RawDraftContentState,
} from 'draft-js';
import PluginEditor from 'draft-js-plugins-editor';
import createListPlugin from 'draft-js-list-plugin';
import { randomEmoji } from './randomEmoji';
import Editable from './Editable';

import classNames from 'classnames/bind';
import style from './BlockEditor.module.css';
const cx = classNames.bind(style);

const listPlugin = createListPlugin({ maxDepth: 100 });
const plugins = [listPlugin];

export type Block = {
    key: string;
    title: string;
    creator: string;
    createdAt: number;
    contentState: RawDraftContentState;
};

type Props = {
    block: Block;
    onUpdateBlockContent: (block: Block, newContentState: ContentState) => void;
    onUpdateBlockTitle: (block: Block, newTitle: string) => void;
    onCreateNewBlock: (title: string) => void;
    onDeleteBlock: (block: Block) => void;
    //    onSetIsolate: (block: Block) => void;
    onFocusPrevious: () => void;
    onFocusNext: () => void;
    onFocusThis: () => void;
    shouldFocus: boolean;
};

export const BlockEditor: React.FC<Props> = React.memo((props: Props) => {
    const [editorState, setEditorState] = React.useState(
        EditorState.createWithContent(convertFromRaw(props.block.contentState))
    );
    const [timestamp, setTimestamp] = React.useState(moment(props.block.createdAt).fromNow());

    const editor = React.useRef<PluginEditor>(null);

    const getSelectedText = () => {
        const selectionState = editorState.getSelection();
        const anchorKey = selectionState.getAnchorKey();
        const currentContent = editorState.getCurrentContent();
        const currentContentBlock = currentContent.getBlockForKey(anchorKey);
        const start = selectionState.getStartOffset();
        const end = selectionState.getEndOffset();
        const selectedText = currentContentBlock.getText().slice(start, end);
        return selectedText;
    };

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
        console.log(event.keyCode);
        if (event.keyCode === 13 && KeyBindingUtil.hasCommandModifier(event)) {
            props.onCreateNewBlock(getSelectedText() || randomEmoji());
            return null;
        }
        if (event.keyCode === 8 && KeyBindingUtil.hasCommandModifier(event)) {
            props.onDeleteBlock(props.block);
            return null;
        }
        if ((event.keyCode === 38 || event.keyCode === 37) && KeyBindingUtil.hasCommandModifier(event)) {
            // up
            props.onFocusPrevious();
            return null;
        }
        if ((event.keyCode === 40 || event.keyCode === 39) && KeyBindingUtil.hasCommandModifier(event)) {
            // down
            props.onFocusNext();
            return null;
        }
        // we press CTRL + K => return 'bbbold'
        // we use hasCommandModifier instead of checking for CTRL keyCode because different OSs have different command keys
        // manages usual things, like:
        // Ctrl+Z => return 'undo'
        return getDefaultKeyBinding(event);
    };

    const onChange = (editorState: EditorState) => {
        setEditorState(editorState);
        props.onUpdateBlockContent(props.block, editorState.getCurrentContent());
    };

    const focusEditor = () => {
        if (editor && editor.current) {
            editor.current.focus();
            props.onFocusThis();
        }
    };

    React.useEffect(() => {
        if (props.shouldFocus) {
            focusEditor();
        }
    }, [props.shouldFocus]);

    const updateTimestamp = () => {
        setTimestamp(moment(props.block.createdAt).fromNow());
    };

    useInterval(updateTimestamp, 1000);

    return (
        <div className={cx('block-container', { focused: props.shouldFocus })}>
            <div className={cx('meta')}>
                <div className={cx('title')}>
                    <Editable
                        value={props.block.title}
                        onUpdateValue={(value: string) => props.onUpdateBlockTitle(props.block, value)}
                    />
                </div>
                <div className={cx('timestamp')}>{timestamp}</div>
                <span className={cx('delete')} onMouseDown={() => props.onDeleteBlock(props.block)}>
                    X
                </span>
            </div>
            <div className={cx('block')} onClick={focusEditor}>
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
