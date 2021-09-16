import jsTPS from "../common/jsTPS.js"
import Top5List from "./Top5List.js";
import ChangeItem_Transaction from "./transactions/ChangeItem_Transaction.js"
import MoveItem_Transaction from "./transactions/MoveItem_Transaction.js";

/**
 * Top5Model.js
 * 
 * This class provides access to all the data, meaning all of the lists. 
 * 
 * This class provides methods for changing data as well as access
 * to all the lists data.
 * 
 * Note that we are employing a Model-View-Controller (MVC) design strategy
 * here so that when data in this class changes it is immediately reflected
 * inside the view of the page.
 * 
 * @author McKilla Gorilla
 * @author ?
 */
export default class Top5Model {
    constructor() {
        // THIS WILL STORE ALL OF OUR LISTS
        this.top5Lists = [];

        // THIS IS THE LIST CURRENTLY BEING EDITED
        this.currentList = null;

        // THIS WILL MANAGE OUR TRANSACTIONS
        this.tps = new jsTPS();

        // WE'LL USE THIS TO ASSIGN ID NUMBERS TO EVERY LIST
        this.nextListId = 0;
    }

    getList(index) {
        return this.top5Lists[index];
    }

    getListIndex(id) {
        for (let i = 0; i < this.top5Lists.length; i++) {
            let list = this.top5Lists[i];
            if (list.id === id) {
                return i;
            }
        }
        return -1;
    }

    setView(initView) {
        this.view = initView;
    }

    addNewList(initName, initItems) {
        let newList = new Top5List(this.nextListId++);
        if (initName)
            newList.setName(initName);
        if (initItems)
            newList.setItems(initItems);
        this.top5Lists.push(newList);
        this.sortLists();
        this.view.refreshLists(this.top5Lists);
        return newList;
    }
    deleteList(id) {
        this.nextListId--;
        let temp = this.top5Lists.splice(id, 1);
        temp = [];
        this.sortLists();
        this.saveLists();
        this.currentList = null;
        this.view.clearWorkspace();
        this.view.clearStatus();
    }
    editListName(newName) {
        this.currentList.setName(newName);
        this.sortLists();
        this.saveLists();
    }

    sortLists() {
        this.top5Lists.sort((listA, listB) => {
            if (listA.getName() < listB.getName()) {
                return -1;
            }
            else if (listA.getName() > listB.getName()) {
                return 1;
            }
            else {
                if(listA.getId() < listB.getId()) {
                    return -1;
                }
                else if(listA.getId() > listB.getId()) {
                    return 1;
                }
                else {
                    return 0;
                }
            }
        });
        this.updateId();
        this.view.refreshLists(this.top5Lists);
    }

    hasCurrentList() {
        return this.currentList !== null;
    }

    unselectAll() {
        for (let i = 0; i < this.top5Lists.length; i++) {
            let list = this.top5Lists[i];
            this.view.unhighlightList(i);
        }
        this.view.updateToolbarButtons(this);
    }
    clearList() {
        this.currentList = null;
        this.view.clearWorkspace();
        this.view.clearStatus(this);
        this.tps.clearAllTransactions();
        this.view.updateToolbarButtons(this);
    }

    loadList(id) {
        let list = null;
        let found = false;
        let i = 0;
        while ((i < this.top5Lists.length) && !found) {
            list = this.top5Lists[i];
            if (list.id === id) {
                // THIS IS THE LIST TO LOAD
                this.currentList = list;
                this.view.update(this.currentList);
                this.view.highlightList(i);
                found = true;
            }
            i++;
        }
        this.tps.clearAllTransactions();
        this.view.updateToolbarButtons(this);
        this.view.showStatus(this);
    }
    hoverList(id) {
        let list = null;
        let found = false;
        let i = 0;
        while ((i < this.top5Lists.length) && !found) {
            list = this.top5Lists[i];
            if (list.id === id) {
                // THIS IS THE LIST TO LOAD
                this.view.hoverList(i);
                found = true;
            }
            i++;
        }    
    }
    unHoverList(id) {
        let list = null;
        let found = false;
        let i = 0;
        while ((i < this.top5Lists.length) && !found) {
            list = this.top5Lists[i];
            if (list.id === id) {
                // THIS IS THE LIST TO LOAD
                found = true;
                this.view.unHoverList(i);
            }
            i++;
        }        
    }

    loadLists() {
        // CHECK TO SEE IF THERE IS DATA IN LOCAL STORAGE FOR THIS APP
        let recentLists = localStorage.getItem("recent_work");
        if (!recentLists) {
            return false;
        }
        else {
            let listsJSON = JSON.parse(recentLists);
            this.top5Lists = [];
            for (let i = 0; i < listsJSON.length; i++) {
                let listData = listsJSON[i];
                let items = [];
                for (let j = 0; j < listData.items.length; j++) {
                    items[j] = listData.items[j];
                }
                this.addNewList(listData.name, items);
            }
            this.sortLists();   
            this.view.refreshLists(this.top5Lists);
            return true;
        }        
    }

    saveLists() {
        // WILL THIS WORK? @todo
        let top5ListsString = JSON.stringify(this.top5Lists);
        localStorage.setItem("recent_work", top5ListsString);
    }

    restoreList() {
        this.view.update(this.currentList);
    }

    addChangeItemTransaction = (id, newText) => {
        // GET THE CURRENT TEXT
        let oldText = this.currentList.items[id];
        let transaction = new ChangeItem_Transaction(this, id, oldText, newText);
        this.tps.addTransaction(transaction);
        this.view.updateToolbarButtons(this);
    }
    addMoveItemTransaction = (oldId, newId) => {
        let transaction = new MoveItem_Transaction(this, oldId, newId);
        this.tps.addTransaction(transaction);
        this.view.updateToolbarButtons(this);
    }
    moveItem(oldIndex, newIndex) {
        let temp = this.currentList.getItemAt(newIndex);
        this.currentList.setItemAt(newIndex, this.currentList.getItemAt(oldIndex)); 
        if(oldIndex < newIndex) {
            for(let i = oldIndex; i < newIndex - 1; i++) {
                this.currentList.setItemAt(i, this.currentList.getItemAt(i+1));
            }
            this.currentList.setItemAt(newIndex - 1, temp);
        }
        else {
            for(let i = oldIndex; i > newIndex + 1; i--) {
                this.currentList.setItemAt(i, this.currentList.getItemAt(i-1));
            }
            this.currentList.setItemAt(newIndex + 1, temp);
        }
        this.view.update(this.currentList);
        this.saveLists();
    }

    changeItem(id, text) {
        this.currentList.items[id] = text;
        this.view.update(this.currentList);
        this.saveLists();
    }
    updateId(list) {
        for(let i = 0; i < this.top5Lists.length; i++) {
            list = this.top5Lists[i];
            list.id = i;
        }
    }

    // SIMPLE UNDO/REDO FUNCTIONS
    undo() {
        if (this.tps.hasTransactionToUndo()) {
            this.tps.undoTransaction();
            this.view.updateToolbarButtons(this);
        }
    }
    redo() {
        if(this.tps.hasTransactionToRedo()) {
            this.tps.doTransaction();
            this.view.updateToolbarButtons(this);
        }
    }
    initToolbarButtons() {
        this.view.updateToolbarButtons(this);
    }
    initAddListButton() {
        this.view.updateAddListButton(this);
    }
    checkNewText(id, newText) {
        let oldText = this.currentList.items[id];
        if(oldText != newText) {
            return true;
        }
        return false;
    }
    
}