/**
 * Top5ListController.js
 * 
 * This file provides responses for all user interface interactions.
 * 
 * @author McKilla Gorilla
 * @author ?
 */
export default class Top5Controller {
    constructor() {

    }

    setModel(initModel) {
        this.model = initModel;
        this.initHandlers();
        this.model.initToolbarButtons();
    }

    initHandlers() {
        // SETUP THE TOOLBAR BUTTON HANDLERS
        document.getElementById("add-list-button").onmousedown = (event) => {
            let newList = this.model.addNewList("Untitled", ["?","?","?","?","?"]);            
            this.model.loadList(newList.id);
            this.model.saveLists();
        }
        document.getElementById("undo-button").onmousedown = (event) => {
            this.model.undo();
        }
        document.getElementById("redo-button").onmousedown = (event) => {
            this.model.redo();
        }
        document.getElementById("close-button").onmousedown = (event) => {
            this.model.unselectAll();
            this.model.clearList();
        }

        // SETUP THE ITEM HANDLERS
        for (let i = 1; i <= 5; i++) {
            let item = document.getElementById("item-" + i);
            item.ondragover = (ev) => {
                ev.preventDefault();
            }
            // AND FOR TEXT EDITING
            item.ondblclick = (ev) => {
                if (this.model.hasCurrentList()) {
                    //BLANK OUT ADD LIST FILE
                    document.getElementById("add-list-button").disabled = true;
                    //Disable Dragging for ease of text box usage.
                    item.draggable = false;
                    // CLEAR THE TEXT
                    item.innerHTML = "";

                    // ADD A TEXT FIELD
                    let textInput = document.createElement("input");
                    textInput.setAttribute("type", "text");
                    textInput.setAttribute("id", "item-text-input-" + i);
                    textInput.setAttribute("value", this.model.currentList.getItemAt(i-1));

                    item.appendChild(textInput);
                    textInput.focus(); //Prevents editing multiple lists at once.

                    textInput.ondblclick = (event) => {
                        this.ignoreParentClick(event);
                    }
                    
                    textInput.onkeydown = (event) => {
                        if (event.key === 'Enter') {
                            if(this.model.checkNewText(i-1, event.target.value)) {
                                this.model.addChangeItemTransaction(i-1, event.target.value);
                            }
                            else {
                                this.model.restoreList();
                            }
                        }
                        item.draggable = true;
                        document.getElementById("add-list-button").disabled = false;
                    }
                    textInput.onblur = (event) => {
                        if(this.model.checkNewText(i-1, event.target.value)) {
                            this.model.addChangeItemTransaction(i-1, event.target.value);
                        }
                        else {
                            this.model.restoreList();
                        }
                        item.draggable = true;
                        document.getElementById("add-list-button").disabled = false;
                    }
                }
            }
            //FOR DRAGGING
            item.ondragstart = (ev) => {
                ev.dataTransfer.setData("text", ev.target.id[5]);
            }
            item.ondrop = (ev) => {
                ev.preventDefault();
                let oldIndex = ev.dataTransfer.getData("text");
                let newIndex = ev.target.id[5];
                if(newIndex != oldIndex) {
                    this.model.addMoveItemTransaction(oldIndex - 1, newIndex - 1);
                }
            }
        }
    }

    registerListSelectHandlers(id) {  
        document.getElementById("top5-list-" + id).onmouseover = (event) => {
            this.model.hoverList(id);
            document.getElementById("top5-list-" + id).onmouseout = (event) => {
                this.model.unHoverList(id);
            }
        }
        
        // FOR SELECTING THE LIST
        document.getElementById("top5-list-" + id).onmousedown = (event) => {
            this.model.unselectAll();

            // GET THE SELECTED LIST
            this.model.loadList(id);
            let list = document.getElementById("top5-list-" + id);
            //FOR RENAMING THE LIST (PART 1)
            list.ondblclick = (ev) => {
                list.innerHTML = "";

                // ADD A TEXT FIELD
                let textInput = document.createElement("input");
                textInput.setAttribute("type", "text");
                textInput.setAttribute("id", "item-text-input-" + id);
                textInput.setAttribute("value", this.model.currentList.getName());

                list.appendChild(textInput);

                textInput.ondblclick = (event) => { 
                    this.ignoreParentClick(event); //Highlight all text.
                }
                textInput.onkeydown = (event) => {
                    if (event.key === 'Enter') {
                        this.model.editListName(event.target.value);
                    }
                }
                textInput.onblur = (event) => {
                    this.model.editListName(event.target.value);
                }                
            }
        }
        // FOR DELETING THE LIST
        document.getElementById("delete-list-" + id).onmousedown = (event) => {
            this.ignoreParentClick(event);
            // VERIFY THAT THE USER REALLY WANTS TO DELETE THE LIST
            let modal = document.getElementById("delete-modal");
            this.listToDeleteIndex = id;
            let listName = this.model.getList(id).getName();
            let deleteSpan = document.getElementById("delete-list-span");
            deleteSpan.innerHTML = "";
            deleteSpan.appendChild(document.createTextNode(listName));
            modal.classList.add("is-visible");
            document.getElementById("dialog-confirm-button").onmousedown = (event) => {
                //Deletes List
                this.model.deleteList(id);
                modal.classList.remove("is-visible");
            }
            document.getElementById("dialog-cancel-button").onmousedown = (event) => {
                modal.classList.remove("is-visible");
            }
        }

    }

    ignoreParentClick(event) {
        event.cancelBubble = true;
        if (event.stopPropagation) event.stopPropagation();
    }
}