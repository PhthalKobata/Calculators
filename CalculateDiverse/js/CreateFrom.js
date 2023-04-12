
'use strict';

class CreateForm {
    constructor(){
        this._domainIds = ['domain0'];
    };

    initialize(){
        this._matrixIds = [];
        this._groupIds = [];
        this._materialIds = [];
        this._optionsValue = {importValue:'none', importRatio:'none'};
        this._domain = [];
        this._groupCount = 0;
        this._loopCount = 1;
    };

    addDomain(){
        const domainText = {};
        this._domainIds.forEach((id) => {
            domainText[id] = document.getElementById(id).value;
        });
        let newIndex = this._domainIds.length;
        let newId = `domain${newIndex}`;
        this._domainIds.push(newId);
        let newInput = `<input type="text" id="${newId}" style="width:500px" value=""><br>`;
        document.getElementById('domain').innerHTML += newInput;
        Object.keys(domainText).forEach((id) => {
            document.getElementById(id).value = domainText[id];
        });
    };

    getGroupCount(){
        let value = document.getElementById('groupCount').value;
        this._groupCount = Number(value);
    };

    getLoopCount(){
        let value = document.getElementById('loopCount').value;
        this._loopCount = Number(value);
    };

    getOptions(){
        this._optionsValue.importValue = this.getSelectedOptions('importValue');
        if(this._optionsValue.importValue === 'random'){
            this._optionsValue.importRatio = this.getSelectedOptions('importRatio');
        };
    };

    getSelectedOptions(name){
        const options = document.getElementsByName(name);
        for(let option of options){
            if(option.checked){
                return option.value;
            };
        };
    };

    getDomains(){
        this._domainIds.forEach((id) => {
            let arr = document.getElementById(id).value.replace(/(,| )+/g, ',').split(',').filter(value => value !== '');
            if(arr.length !== 0){
                this._domain.push(Array.from(new Set(arr)));
            };
        });
    };

    checkDomain(){
        const allDomains = this._domain.flat();
        this._valid = allDomains.length === Array.from(new Set(allDomains)).length;
    };

    showSettingParams(){
        document.getElementById('showDomains').textContent = JSON.stringify(this._domain).replace(/^\[|\]$|"/g, '');
        document.getElementById('showLoopCount').textContent = this._loopCount;
        document.getElementById('showGroupCount').textContent = this._groupCount;
    };

    createManualMatrix(){
        const allDomains = [''].concat(...this._domain);
        this.createTable('manualMatrix', this._groupCount + 1, allDomains.length);
        allDomains.forEach((value, index) => {
            document.getElementById(`manualMatrix-r0c${index}`).textContent = value;
        });
        for(let i = 1; i <= this._groupCount; i++){
            document.getElementById(`manualMatrix-r${i}c0`).textContent = `Group${i}`;
        };
    };

    createRandomMaterial(){
        const allDomains = [''].concat(...this._domain);
        this.createTable('randomMaterial', allDomains.length, 2);
        allDomains.forEach((value, index) => {
            document.getElementById(`randomMaterial-r${index}c0`).textContent = value;
        });
        document.getElementById(`randomMaterial-r0c0`).textContent = "要素";
        document.getElementById(`randomMaterial-r0c1`).textContent = "個数";        
    };

    createRandomGroup(){
        this.createTable('randomGroup', this._groupCount + 1, this._domain.length + 1);
        for(let r = 1; r <= this._groupCount; r++){
            document.getElementById(`randomGroup-r${r}c0`).textContent = `Group${r}`;
        };
        for(let c = 1; c <= this._domain.length; c++){
            document.getElementById(`randomGroup-r0c${c}`).textContent = JSON.stringify(this._domain[c - 1]);
        }
        document.getElementById(`randomGroup-r0c0`).textContent = "グループ";
    };

    createTable(tbodyId, row, column){
        const tbody = document.getElementById(tbodyId);
        for(let r = 0; r < row; r++){
            let tr = document.createElement('tr');
            for(let c = 0; c < column; c++){
                if(r === 0 || c === 0){
                    let th = document.createElement('th');
                    th.innerHTML = `<span id="${tbodyId}-r${r}c${c}"></span>`;
                    tr.appendChild(th);
                }
                else{
                    let td = document.createElement('td');
                    td.innerHTML = `<input type="number" id="${tbodyId}-r${r}c${c}" min="0" style="width:100px" value="">`;
                    tr.appendChild(td);    
                };
            };
            tbody.appendChild(tr);
        };
    };

    removeTable(tbodyId){
        const tbody = document.getElementById(tbodyId);
        while(tbody.firstChild){
            tbody.removeChild(tbody.firstChild);
        };
    };

    addAutoButton(bool){
        let sentense = "数値の一括入力<br>"
        let textHtml = `<input type="number" id="autoImportGroup" class="autoImport" min="0" value="0">`;
        let buttonHtml = `<input type="button" value="一括入力" onclick="autoImport('group')">`;
        document.getElementById('groupColumn').innerHTML = (bool ? `${sentense}${textHtml}${buttonHtml}` : '');
    };

    autoImport(materialOrGroup){
        let value = 0;
        const allDomains = this._domain.flat();
        switch(materialOrGroup){
            case 'material':
                value = document.getElementById('autoImportMaterial').value;
                allDomains.forEach((_, index) => {
                    document.getElementById(`randomMaterial-r${index + 1}c1`).value = Number(value || 0);
                });    
            break;
            case 'group':
                value = document.getElementById('autoImportGroup').value;
                this._domain.forEach((_, c) => {
                    for(let r = 0; r < this._groupCount; r++){
                        document.getElementById(`randomGroup-r${r + 1}c${c + 1}`).value = Number(value || 0);
                    };
                });
            break;
            case 'manualMatrix':
                value = document.getElementById('autoImportManualMatrix').value;
                allDomains.forEach((_, c) => {
                    for(let r = 0; r < this._groupCount; r++){
                        document.getElementById(`manualMatrix-r${r + 1}c${c + 1}`).value = Number(value || 0);
                    };
                });
            break;
        };
    };

    showTable(){
        if(this._optionsValue.importValue === 'manual'){
            document.getElementById('loopCount').value = 1;
            this._loopCount = 1;
            document.getElementById('manualTable').style.display = 'block';
            this.createManualMatrix();
        }
        else{
            document.getElementById('randomTable').style.display = 'block';
            this.createRandomMaterial();
            if(this._optionsValue.importRatio === 'manual'){
                this.createRandomGroup();
            };
            this.addAutoButton(this._optionsValue.importRatio === 'manual');
        };
    }
    
    main(){
        this.initialize();
        this.getGroupCount();
        this.getDomains();
        this.getLoopCount();
        this.getOptions();
        this.checkDomain();
        if(this._valid){
            this.showTable();
            this.showSettingParams();    
        }
        else{
            alert("定義域の要素に重複があります");
        };
    };

    parameters(){
        return {
            groupCount:this._groupCount,
            domains:this._domain,
            loopCount:this._loopCount,
            options:this._optionsValue
        };
    };

    valid(){
        return this._valid;
    };
};