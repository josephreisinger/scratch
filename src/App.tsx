import React, { useEffect } from 'react';
import { produce } from 'immer';
import moment from 'moment';
import useInterval from '@use-it/interval';
import { debounce } from 'throttle-debounce';
import { ContentState, EditorState, convertToRaw } from 'draft-js';
import * as pako from 'pako';

import { Block, BlockEditor } from './BlockEditor';

import './App.css';

const pack = JSON.stringify;
const unpack = JSON.parse;

type State = {
    blocks: Record<string, Block>;
    blockOrder: string[];
};

const newBlock = (key: string, creator: string = 'me') => ({
    key,
    creator,
    createdAt: new Date().valueOf(),
    contentState: convertToRaw(EditorState.createEmpty().getCurrentContent()),
});

const initialState: State = {
    blocks: {
        '👋': newBlock('👋'),
    },
    blockOrder: ['👋'],
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

const App: React.FC = React.memo(() => {
    const [state, setState] = React.useState(deserialize(window.location.hash));

    const finalizeState = (producerFn: (draft: State) => void) => {
        const newState = produce(state, producerFn);
        setState(newState);
        window.location.hash = serialize(newState);
    };

    const debouncedOnUpdateBlock = debounce(500, false, (block: Block, newContentState: ContentState) => {
        finalizeState((draft) => {
            draft.blocks[block.key].contentState = convertToRaw(newContentState);
        });
    });

    const onUpdateBlock = (block: Block, newContentState: ContentState) => {
        debouncedOnUpdateBlock(block, newContentState);
    };

    const onCreateNewBlock = (_title?: string) => {
        const title = _title || new Date().toISOString();
        const key = makeUniqueKey(title, state.blockOrder);

        finalizeState((draft) => {
            draft.blocks[key] = newBlock(key);
            draft.blockOrder = [key, ...draft.blockOrder];
        });
    };

    const onDeleteBlock = (block: Block) => {
        finalizeState((draft) => {
            delete draft.blocks[block.key];
            const index = draft.blockOrder.indexOf(block.key);
            if (index > -1) {
                draft.blockOrder.splice(index, 1);
            }
        });
    };

    const hasBlock = (key: string) => {
        return state.blockOrder.indexOf(key) >= 0;
    };

    const checkTodayBlock = () => {
        const today = moment().format('MMMM Do YYYY');
        if (!hasBlock(today)) {
            onCreateNewBlock(today);
        }
    };

    useInterval(checkTodayBlock, 1000);

    useEffect(checkTodayBlock);

    return (
        <div className="container">
            {state.blockOrder.map((key, i) => (
                <BlockEditor
                    key={key}
                    block={state.blocks[key]}
                    onUpdateBlock={onUpdateBlock}
                    onDeleteBlock={onDeleteBlock}
                    onCreateNewBlock={onCreateNewBlock}
                    shouldFocus={i === 0}
                />
            ))}
        </div>
    );
});

export default App;
