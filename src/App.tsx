import React, { useEffect } from 'react';
import moment from 'moment';
import { useHotkeys } from 'react-hotkeys-hook';
import useInterval from '@use-it/interval';
import { debounce } from 'throttle-debounce';
import { ContentState, EditorState, convertToRaw } from 'draft-js';
import * as pako from 'pako';
// import * as Automerge from 'automerge';
import { produce } from 'immer';

import { Block, BlockEditor } from './BlockEditor';
import { randomEmoji } from './randomEmoji';

import './reset.css';

import classNames from 'classnames/bind';
import style from './App.module.css';
const cx = classNames.bind(style);

/*
 *const pack = Automerge.save;
 *const unpack = Automerge.load;
 */
const pack = JSON.stringify;
const unpack = JSON.parse;

type State = {
    blocks: Record<string, Block>;
    blockOrder: string[];
};

const newBlock = (key: string, title: string, creator: string = 'me') => ({
    key,
    title,
    creator,
    createdAt: new Date().valueOf(),
    contentState: convertToRaw(EditorState.createEmpty().getCurrentContent()),
});

const initialState: State = {
    blocks: {},
    blockOrder: [],
};

const serialize = (state: State): string => new Buffer(pako.deflate(pack(state))).toString('base64');

const deserialize = (compressedState: string): State => {
    try {
        return unpack(
            pako.inflate(Buffer.from(compressedState || '', 'base64'), {
                to: 'string',
            })
        ) as State;
    } catch (e) {
        // return Automerge.from(initialState);
        return initialState;
    }
};

const makeUniqueKey = (newName: string, existingNames: string[]) => {
    let nameIndex = 0;
    let candidateName = newName;
    const re = /^(.+)\s(\d+)$/;
    const match = re.exec(newName);

    // Remove any trailing number from newName
    const stemmedNewName = match ? match[1] : newName;

    for (;;) {
        if (!existingNames.includes(candidateName)) {
            return candidateName;
        }

        nameIndex += 1;
        candidateName = `${stemmedNewName} ${nameIndex}`;
    }
};

const initialHashState = deserialize(window.location.hash);

const App: React.FC = () => {
    const [state, setState] = React.useState(initialHashState);
    const [focusIdx, setFocusIdx] = React.useState(0);

    const finalizeState = (producerFn: (draft: State) => void) => {
        //   setState((state) => Automerge.change(state, producerFn));
        setState((state) => produce(state, producerFn));
    };

    const onUpdateBlock = (block: Block, newContentState?: ContentState, newTitle?: string) => {
        finalizeState((draft) => {
            if (newContentState !== undefined) {
                draft.blocks[block.key].contentState = convertToRaw(newContentState);
            }
            if (newTitle !== undefined) {
                draft.blocks[block.key].title = newTitle;
            }
        });
    };

    const onUpdateBlockContent = (block: Block, newContentState: ContentState) => {
        onUpdateBlock(block, newContentState);
    };

    const onUpdateBlockTitle = (block: Block, newTitle: string) => {
        onUpdateBlock(block, undefined, newTitle);
    };

    const onCreateNewBlock = (title: string) => {
        finalizeState((draft) => {
            const key = makeUniqueKey(title, draft.blockOrder);
            draft.blocks[key] = newBlock(key, title);
            draft.blockOrder = [key, ...draft.blockOrder];
        });
        setFocusIdx(0);
    };

    const onDeleteBlock = (block: Block) => {
        finalizeState((draft) => {
            delete draft.blocks[block.key];
            draft.blockOrder.splice(draft.blockOrder.indexOf(block.key), 1);
        });
    };

    const hasBlock = (key: string) => state.blockOrder.indexOf(key) >= 0;

    const checkTodayBlock = () => {
        const today = moment().format('MMMM Do YYYY');
        if (!hasBlock(today)) {
            onCreateNewBlock(today);
        }
    };

    useInterval(checkTodayBlock, 1000);

    useEffect(checkTodayBlock, [state]);

    const debouncedOnSerialize = debounce(200, false, () => {
        const newHash = serialize(state);
        if (window.history && window.history.pushState) {
            window.history.pushState(
                null,
                state.blockOrder.length > 0 ? `${state.blocks[state.blockOrder[0]].title} — scratch` : `scratch`,
                `#${newHash}`
            );
        } else {
            window.location.hash = `#${newHash}`;
        }
    });

    const onFocusThis = (idx: number) => () => setFocusIdx(idx);
    const onFocusNext = (idx: number) => () => setFocusIdx((idx + 1) % state.blockOrder.length);
    const onFocusPrevious = (idx: number) => () =>
        setFocusIdx((idx - 1 + state.blockOrder.length) % state.blockOrder.length);

    useEffect(debouncedOnSerialize, [state]);

    useHotkeys('command+enter', () => onCreateNewBlock(randomEmoji()));

    return (
        <div className={cx('container')}>
            {state.blockOrder.map((key, i) => (
                <BlockEditor
                    key={key}
                    block={state.blocks[key]}
                    onUpdateBlockContent={onUpdateBlockContent}
                    onUpdateBlockTitle={onUpdateBlockTitle}
                    onCreateNewBlock={onCreateNewBlock}
                    onDeleteBlock={onDeleteBlock}
                    onFocusNext={onFocusNext(i)}
                    onFocusPrevious={onFocusPrevious(i)}
                    onFocusThis={onFocusThis(i)}
                    shouldFocus={i === focusIdx}
                />
            ))}
            <div className={cx('footer')}>{window.location.hash.length} chars</div>
        </div>
    );
};

export default App;
