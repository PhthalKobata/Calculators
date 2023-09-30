'use strict';

/**
 * ----------------------------------------------------------------------------------------------------------------------------------------
 * @classdesc フォーム作成およびフォーム操作のクラス
 * ----------------------------------------------------------------------------------------------------------------------------------------
 */
class CreateForm {
    constructor(){
        this._domainIds = ['domain0'];
        this._caluclatorCells = [];
    };

    /**
     * 初期化
     */
    initialize(){
        this._optionsValue = {importValue:'none', importRatio:'none'};
        this._materials = [];
        this._domain = [];
        this._groupCount = 0;
        this._loopCount = 1;
        this._errorNumber = 0;
    };

    /**
     * 定義域枠の追加
     */
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

    /**
     * フォームから値を取得
     */
    getProperties(){
        const createParameters = new CreateParameters(this._domainIds);
        createParameters.main();
        this._params = createParameters.params();
        this._groupCount   = this._params.groupCount;
        this._domain       = this._params.domain;
        this._loopCount    = this._params.loopCount;
        this._optionsValue = this._params.options;
        this._tableProp    = this._params.tableProp;
    };

    /**
     * 自動計算のインスタンス
     */
    setControlMatrix(){
        this._controlMatrix = {
            fixedMatrix:          new ControlMatrix('fixedMatrix', this._tableProp),
            randomMatrix_material: new ControlMatrix('randomMatrix_material', this._tableProp),
            randomMatrix_group:     new ControlMatrix('randomMatrix_group', this._tableProp)
        };
    };

    /**
     * 定義域にエラーがないかをチェック
     */
    checkDomain(){
        const allDomains = this._domain.flat();
        if(allDomains.length === 0){
            this._errorNumber = 1;            
        }
        if(allDomains.length !== Array.from(new Set(allDomains)).length){
            this._errorNumber = 2;
        };
    };

    /**
     * パラメータの表示
     */
    showSettingParams(){
        document.getElementById('showDomains').textContent = JSON.stringify(this._domain).replace(/^\[|\]$|"/g, '');
        document.getElementById('showLoopCount').textContent = this._loopCount;
        document.getElementById('showGroupCount').textContent = this._groupCount;
    };


    /**
     * テーブルの作成
     */
    showTable(){
        const createInputTable = new CreateInputTable(this._params, this);
        if(this._optionsValue.importValue === 'fixed'){
            document.getElementById('loopCount').value = 1;
            this._loopCount = 1;
            document.getElementById('fixedTable').style.display = 'block';
            createInputTable.fixedMatrix();
            createInputTable.addAutoButton('fixedMatrix', true);
            document.getElementById('total-fixedMatrix').innerHTML = '0';
        }
        else{
            document.getElementById('randomTable').style.display = 'block';
            createInputTable.randomMatrix_material();
            if(this._optionsValue.importRatio === 'fixed'){
                createInputTable.randomMatrix_group();
            };
            createInputTable.addAutoButton('randomMatrix_material', true);
            createInputTable.addAutoButton('randomMatrix_group', this._optionsValue.importRatio === 'fixed');
        };
        this._caluclatorCells = createInputTable.caluclatorCells();
    };

    /**
     * テーブルの削除
     * @param {Array.<string>} tbodyIds 
     */
    removeTables(tbodyIds){
        tbodyIds.forEach((tbodyId) => {
            const tbody = document.getElementById(tbodyId);
            while(tbody.firstChild){
                tbody.removeChild(tbody.firstChild);
            };        
        });
    };

    /**
     * 自動計算テーブル幅高さの自動調整
     */
    resizeTable(){
        this._caluclatorCells.forEach((obj) => {
            obj.element.style.height = obj.refCell.offsetHeight + 'px';
            obj.element.style.width = obj.refCell.offsetWidth + 'px';
        });
    };

    /**
     * 自動入力
     * @param {string} tbodyId 
     */
    autoImport(tbodyId){
        this._controlMatrix[tbodyId].autoImport();
    };

    /**
     * 自動計算
     * @param {string} tbodyId 
     * @param {number} index_r 
     * @param {number} index_c 
     */
    autoCalculate(tbodyId, index_r = -1, index_c = -1){
        this._controlMatrix[tbodyId].autoCalculate(index_r, index_c)
    };

    /**
     * メインメソッド
     */
    main(){
        this.initialize();
        this.getProperties();
        this.checkDomain();
        switch(this._errorNumber){
            case 0:{
                this.showTable();
                this.showSettingParams();    
                this.setControlMatrix();
                break;
            }
            case 1:{
                window.alert('定義域が設定されていません');
                break;
            }
            case 2:{
                window.alert('定義域の要素に重複があります');
                break;
            }
        };
    };

    /**
     * アクセサ this._params
     * @returns {Object}
     */
    params(){
        return this._params;
    };

    /**
     * アクセサ this._valid
     * @returns {boolean}
     */
    valid(){
        return this._errorNumber === 0;
    };
};

/**
 * ----------------------------------------------------------------------------------------------------------------------------------------
 * @classdesc 入力パラメータを受け取るクラス
 * @param {Array.<string>} domainIds
 * ----------------------------------------------------------------------------------------------------------------------------------------
 */

class CreateParameters {
    constructor(domainIds){
        this._domainIds = domainIds;
        this._optionsValue = {importValue:'none', importRatio:'none'};
        this._materials = [];
        this._domain = [];
        this._groupCount = 0;
        this._loopCount = 1;
    };

    //フォームから値を取得

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

    /**
     * 多次元の定義域から全組み合わせの定義域を作成する
     * @param {number} i 
     * @param {Array.<string>} current 
     */
    setMaterials(i = 0, current = []){
        if(i === this._domain.length){
            this._materials.push(current);
        }
        else{
            for(let j = 0; j < this._domain[i].length; j++) {
                this.setMaterials(i + 1, [...current, this._domain[i][j]]);
            };
        };
    };

    /**
     * テーブルの行列を指定
     */
    setTableProperties(){
        this._tableProp = {
            fixedMatrix:{
                row   : this._groupCount + 1,
                column: this._materials.length + 1
            },
            randomMatrix_material:{
                row   : this._materials.length + 1,
                column: 2
            },
            randomMatrix_group:{
                row   :this._groupCount + 1,
                column: 2
            }
        };
    };

    /**
     * メインメソッド
     */
    main(){
        this.getGroupCount();
        this.getDomains();
        this.getLoopCount();
        this.getOptions();
        this.setMaterials();
        this.setTableProperties();
    };

    /**
     * アクセサ
     * @returns {Object}
     */
    params(){
        return {
            groupCount:this._groupCount,
            domain:this._domain,
            loopCount:this._loopCount,
            options:this._optionsValue,
            materials: this._materials,
            tableProp: this._tableProp
        };
    };
};


/**
 * ----------------------------------------------------------------------------------------------------------------------------------------
 * @classdesc 入力テーブルを作成するクラス
 * @param {Object} params
 * @param {CreateForm} _CreateForm -CreateFormインスタンス
 * ----------------------------------------------------------------------------------------------------------------------------------------
 */

class CreateInputTable {
    constructor(params, _CreateForm){
        this.initialize(params);
        this._CreateForm = _CreateForm;
    };

    /**
     * 初期化
     * @param {Object} params 
     */
    initialize(params){
        this._materials = params.materials;
        this._domain = params.domain;
        this._groupCount = params.groupCount;
        this._tableProp = params.tableProp;
        this._caluclatorCells = [];
        this.createMaterialNames();
    };

    /**
     * 行列に記述するための要素名配列
     */
    createMaterialNames(){
        this._materialNames = this._materials.map((value) => {
            return JSON.stringify(value).replace(/"/g, '').replace(/^\[,+/, '[').replace(/,+\]$/, ']');
        });
    };

    /**
     * 各集団の要素の内訳は決まっている場合のテーブル作成
     */
    fixedMatrix(){
        this.createTable('fixedMatrix', (tbodyId, r, c) => {
            return `<input type="number" id="${tbodyId}-r${r}c${c}" min="0" style="width:100px" value="0">`;
        });
        this._materialNames.forEach((value, index) => {
            document.getElementById(`fixedMatrix-r0c${index + 1}`).textContent = value;
        });
        for(let r = 1; r < this._tableProp.fixedMatrix.row; r++){
            document.getElementById(`fixedMatrix-r${r}c0`).textContent = `Group${r}`;
        };
        this.addCalculatorOfColumn('fixedMatrix');
        this.addCalculatorOfRow('fixedMatrix');
    };

    /**
     * 各集団の要素の内訳をランダムに決める場合の要素数テーブル作成
     */
    randomMatrix_material(){
        this.createTable('randomMatrix_material', (tbodyId, r, c) => {
            return `<input type="number" id="${tbodyId}-r${r}c${c}" min="0" style="width:100px" value="0">`;
        });
        this._materialNames.forEach((value, index) => {
            document.getElementById(`randomMatrix_material-r${index + 1}c0`).textContent = value;
        });
        document.getElementById(`randomMatrix_material-r0c0`).textContent = "要素";
        document.getElementById(`randomMatrix_material-r0c1`).textContent = "個数";            
        this.addCalculatorOfColumn('randomMatrix_material');  
    };

    /**
     * 各集団の要素の内訳をランダムに決める場合の集団のテーブル作成
     */
    randomMatrix_group(){
        this.createTable('randomMatrix_group', (tbodyId, r, c) => {
            return `<input type="number" id="${tbodyId}-r${r}c${c}" min="0" style="width:100px" value="0">`;
        });
        for(let r = 1; r < this._tableProp.randomMatrix_group.row; r++){
            document.getElementById(`randomMatrix_group-r${r}c0`).textContent = `Group${r}`;
        };
        document.getElementById(`randomMatrix_group-r0c0`).textContent = "グループ";
        document.getElementById(`randomMatrix_group-r0c1`).textContent = "要素数";
        this.addCalculatorOfColumn('randomMatrix_group');  
    };


    /**
     * 実際にテーブルを作成するメソッド。コールバックはtdのhtmlString
     * @param {string} tbodyId 
     * @param {createTable~callback} callback_tdInnerHTML 
     */
    createTable(tbodyId, callback_tdInnerHTML){
        const tbody = document.getElementById(tbodyId);
        for(let r = 0; r < this._tableProp[tbodyId].row; r++){
            let tr = document.createElement('tr');
            for(let c = 0; c < this._tableProp[tbodyId].column; c++){
                if(r === 0 || c === 0){
                    const th = document.createElement('th');
                    th.id = `th-${tbodyId}-r${r}c${c}`;
                    th.innerHTML = `<span id="${tbodyId}-r${r}c${c}"></span>`;
                    tr.appendChild(th);
                }
                else{
                    const input = this.domParse(callback_tdInnerHTML(tbodyId, r, c));
                    input.addEventListener('change', () => {
                        this._CreateForm.autoCalculate(tbodyId, r, c);
                    });
                    const td = document.createElement('td');
                    td.id = `td-${tbodyId}-r${r}c${c}`;
                    td.appendChild(input);
                    tr.appendChild(td);
                };
            };
            tbody.appendChild(tr);
        };
    };
    /**
     * @callback createTable~callback
     * @param {string} tbodyId
     * @param {number} r
     * @param {number} c
     * @returns {string}
     */

    /**
     * 数値の一括入力のボタンを作成
     * @param {string} tbodyId 
     * @param {boolean} bool 
     */
    addAutoButton(tbodyId, bool){
        const sentense = "数値の一括入力<br>"
        const textHtml = `<input type="number" id="autoImport_${tbodyId}" class="autoImport" min="0" value="0">`;
        const buttonHtml = `<input type="button" value="一括入力">`;
        const input = this.domParse(buttonHtml);
        input.addEventListener('click', () => {
            this._CreateForm.autoImport(tbodyId);
        });
        const importButton = document.getElementById(`importButton-${tbodyId}`);
        if(bool){
            importButton.innerHTML = `${sentense}${textHtml}`;
            importButton.appendChild(input);
        }
        else{
            importButton.innerHTML = '';
        };
    };

    /**
     * HtmlStringからDOMを作成
     * @param {string} htmlString 
     * @returns {Node}
     */
    domParse(htmlString){
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlString, 'text/html');
        return doc.body.firstChild;
    };

    /**
     * /列の値を自動計算枠追加（下に追加されるやつ）
     * @param {string} tbodyId 
     */
    addCalculatorOfColumn(tbodyId){
        const tbody_result = document.getElementById(`totalColumns-${tbodyId}`);
        let tr = document.createElement('tr');
        for(let c = 0; c < this._tableProp[tbodyId].column; c++){
            let element = document.createElement(c === 0 ? 'th' : 'td');
            element.innerHTML = `<span style="color:blue;" id="totalColumns-${tbodyId}-c${c}">${c === 0 ? 'total' : '0'}</span>`;
            let refCell = document.getElementById(`${c === 0 ? 'th' : 'td'}-${tbodyId}-r1c${c}`);
            this._caluclatorCells.push({element: element, refCell: refCell});
            tr.appendChild(element);
        };
        tbody_result.appendChild(tr);
    };

    /**
     * /列の値を自動計算枠追加（右に追加されるやつ）
     * @param {string} tbodyId 
     */
    addCalculatorOfRow(tbodyId){
        const tbody_result = document.getElementById(`totalRows-${tbodyId}`);
        for(let r = 0; r < this._tableProp[tbodyId].row; r++){
            let tr = document.createElement('tr');
            let element = document.createElement(r === 0 ? 'th' : 'td');
            element.innerHTML = `<span style="color:blue;" id="totalRows-${tbodyId}-r${r}">${r === 0 ? 'total' : '0'}</span>`;
            let refCell = document.getElementById(`${r === 0 ? 'th' : 'td'}-${tbodyId}-r${r}c1`);
            this._caluclatorCells.push({element: element, refCell: refCell});
            tr.appendChild(element);
            tbody_result.appendChild(tr);
        };
    };

    //
    /**
     * アクセサ
     * @returns {Array.<{element:Node, refCell:Node}>}
     */
    caluclatorCells(){
        return this._caluclatorCells;
    };
};

/**
 * ----------------------------------------------------------------------------------------------------------------------------------------
 * @classdesc 自動計算や自動入力処理のためのクラス
 * @param {String} tbodyId
 * @param {Object} tableProp
 * ----------------------------------------------------------------------------------------------------------------------------------------
 */
class ControlMatrix {
    constructor(tbodyId, tableProp){
        this._tbodyId = tbodyId;
        this._prop = tableProp[tbodyId];
        this.initialize();
    };

    /**
     * 初期化
     */
    initialize(){
        this._totalRowsId    = `totalRows-${this._tbodyId}`;
        this._totalColumnsId = `totalColumns-${this._tbodyId}`;
        this._totalId        =`total-${this._tbodyId}`;
        this._exists = {
            totalRows   : document.getElementById(`${this._totalRowsId}-r1`) !== null,
            totalColumns: document.getElementById(`${this._totalColumnsId}-c1`) !== null,
            total       : document.getElementById(this._totalId) !== null
        };
    };

    /**
     * 列の自動計算
     * @param {number} columnNumber 
     */
    autoCalculateColumn(columnNumber){
        const spanElem = document.getElementById(`${this._totalColumnsId}-c${columnNumber}`);
        spanElem.textContent = Array.from({length:this._prop.row - 1}).reduce((p, _, i) => {
            let e = document.getElementById(`${this._tbodyId}-r${i + 1}c${columnNumber}`);
            if(e === null){
                return p;
            };
            return p + Number(e.value || 0);
        }, 0);
    };

    /**
     * 行の自動計算
     * @param {number} rowNumber 
     */
    autoCalculateRow(rowNumber){
        const spanElem = document.getElementById(`${this._totalRowsId}-r${rowNumber}`);
        spanElem.textContent = Array.from({length:this._prop.column - 1}).reduce((p, _, i) => {
            let e = document.getElementById(`${this._tbodyId}-r${rowNumber}c${i + 1}`);
            if(e === null){
                return p;
            };
            return p + Number(e.value || 0);
        }, 0);
    };

    /**
     * 行列の自動計算
     */
    autoCalculateAll(){
        const spanElem = document.getElementById(this._totalId);
        let total = 0;
        for(let r = 1; r < this._prop.row; r++){
            for(let c = 1; c < this._prop.column; c++){
                let e = document.getElementById(`${this._tbodyId}-r${r}c${c}`);
                if(e !== null){
                    total += Number(e.value || 0);
                };
            };
        };
        spanElem.textContent = total;
    };

    /**
     * それぞれの自動計算
     * @param {number} rowNumber 
     * @param {number} columnNumber 
     */
    autoCalculate(rowNumber = -1, columnNumber = -1){
        if(this._exists.totalColumns && columnNumber > 0){
            this.autoCalculateColumn(columnNumber);
        };
        if(this._exists.totalRows && rowNumber > 0){
            this.autoCalculateRow(rowNumber);
        };
        if(this._exists.total){
            this.autoCalculateAll();
        };
    };

    /**
     * 自動入力
     */
    autoImport(){
        let value = document.getElementById(`autoImport_${this._tbodyId}`).value;
        for(let r = 1; r < this._prop.row; r++){
            for(let c = 1; c < this._prop.column; c++){
                let element = document.getElementById(`${this._tbodyId}-r${r}c${c}`);
                if(element !== null){
                    element.value = Number(value || 0);
                };
            };
        };
        if(this._exists.totalColumns){
            for(let c = 1; c < this._prop.column; c++){
                this.autoCalculateColumn(c);
            };
        };
        if(this._exists.totalRows){
            for(let r = 1; r < this._prop.row; r++){
                this.autoCalculateRow(r);
            };
        };
        if(this._exists.total){
            this.autoCalculateAll();
        };
    };
};