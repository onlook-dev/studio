import { sendAnalytics } from '@/lib/utils';
import { makeAutoObservable } from 'mobx';
import { Action, Change } from '/common/actions';

function reverse<T>(change: Change<T>): Change<T> {
    return { updated: change.original, original: change.updated };
}

function undoAction(action: Action): Action {
    switch (action.type) {
        case 'update-style':
            return {
                type: 'update-style',
                targets: action.targets,
                style: action.style,
                change: reverse(action.change),
            };
        case 'insert-element':
            return {
                type: 'remove-element',
                targets: action.targets,
                position: action.position,
                element: action.element,
            };
        case 'remove-element':
            return {
                type: 'insert-element',
                targets: action.targets,
                position: action.position,
                element: action.element,
            };
    }
}

enum TransactionType {
    IN_TRANSACTION = 'in-transaction',
    NOT_IN_TRANSACTION = 'not-in-transaction',
}

interface InTransaction {
    type: TransactionType.IN_TRANSACTION;
    action: Action | null;
}

interface NotInTransaction {
    type: TransactionType.NOT_IN_TRANSACTION;
}

type TransactionState = InTransaction | NotInTransaction;

export class HistoryManager {
    constructor(
        private undoStack: Action[] = [],
        private redoStack: Action[] = [],
        private inTransaction: TransactionState = { type: TransactionType.NOT_IN_TRANSACTION },
    ) {
        makeAutoObservable(this);
    }

    get canUndo() {
        return this.undoStack.length > 0;
    }

    get canRedo() {
        return this.redoStack.length > 0;
    }

    get isInTransaction() {
        return this.inTransaction.type === TransactionType.IN_TRANSACTION;
    }

    get length() {
        return this.undoStack.length;
    }

    startTransaction = () => {
        this.inTransaction = { type: TransactionType.IN_TRANSACTION, action: null };
    };

    commitTransaction = () => {
        if (
            this.inTransaction.type === TransactionType.NOT_IN_TRANSACTION ||
            this.inTransaction.action == null
        ) {
            return;
        }

        const actionToCommit = this.inTransaction.action;

        this.inTransaction = { type: TransactionType.NOT_IN_TRANSACTION };

        this.push(actionToCommit);
    };

    push = (action: Action) => {
        if (this.inTransaction.type === TransactionType.IN_TRANSACTION) {
            this.inTransaction.action = action;
            return;
        }

        if (this.redoStack.length > 0) {
            this.redoStack = [];
        }

        this.undoStack.push(action);

        if (action.type === 'update-style') {
            sendAnalytics('edit action', {
                type: action.type,
                style: action.style,
                new_value: action.change.updated,
                original_value: action.change.original,
            });
        }
    };

    undo = (): Action | null => {
        if (this.inTransaction.type === TransactionType.IN_TRANSACTION) {
            this.commitTransaction();
        }

        const top = this.undoStack.pop();
        if (top == null) {
            return null;
        }

        this.redoStack.push(top);
        return undoAction(top);
    };

    redo = (): Action | null => {
        if (this.inTransaction.type === TransactionType.IN_TRANSACTION) {
            this.commitTransaction();
        }

        const top = this.redoStack.pop();
        if (top == null) {
            return null;
        }

        this.undoStack.push(top);
        return top;
    };
}
