class Jeopardy {
    constructor(ignoreElementsThatStartWithThis="//") {
        this.ignore=ignoreElementsThatStartWithThis;
    }
    getGameDetails(){
        return {
            "categoryCount" :this.cAmount,
            "questionCount": this.qAmount,
            "categories": this.categories,
            "pointValues": this.pointValues
        }
    }
    questionsLeft(){
        for(let i=0;i<this.cAmount;i++){
            for(let j=0;j<this.qAmount;j++){
                if(this.available[i][j]){
                    return true;
                }
            }
        }
        return false;
    }
    setQuestions(arr) {
        this.questions = [];
        let qAmount = arr[0].length;
        for (let r = 0; r < arr.length; r++) {//rows: categories
            this.questions[r] = [];
            for (let c = 0; c < arr[r].length; c++) {//columns: q/a for category
                if (qAmount != arr[r].length) {
                    return -1;//invalid
                }
                this.questions[r][c] = arr[r][c];
            }
        }
        this.qAmount = qAmount;
        this.cAmount = arr.length;
        return qAmount;
    }
    setAnswers(arr) {
        this.answers = [];
        this.available = [];
        let qAmount = arr[0].length;
        for (let r = 0; r < arr.length; r++) {//rows: categories
            this.answers[r] = [];
            this.available[r] = [];
            for (let c = 0; c < arr[r].length; c++) {//columns: q/a for category
                if (qAmount != arr[r].length) {
                    return -1;//invalid
                }
                this.available[r][c] = true;
                this.answers[r][c] = arr[r][c];
            }
        }
        return qAmount;
    }
    setCategories(arr) {
        this.categories = arr;
        return this.categories.length;
    }
    setPointValues(arr) {
        if (arr&&arr.length>0){
            this.pointValues = arr.map(el=>parseInt(el));
        } 
        else {
            this.pointValues = [];
            for (let i = 0; i < this.categories.length; i++) {//categories must be set before point values
                this.pointValues[i] = (i + 1) * 100;
            }
        }
        return this.pointValues.length;
    }
    setImages(arr){
        for(let i=0;i<arr.length;i++){
            this.setImage(arr[i]);
        }
    }
    setImage(data){
        if(data.length<3){
            return false;
        }
        data[0]=parseInt(data[0]);
        data[1]=parseInt(data[1]);
        if(!this.images[data[0]]){
            this.images[data[0]]=[];
        }
        this.images[data[0]][data[1]]={"url":data[2],"showWith":(data[3])?data[3].toLowerCase():"question"};
    }
    deselectQuestion(cat, no) {
        this.available[cat][no] = true;
    }
    resetGame() {
        for (let r = 0; r < this.cAmount; r++) {
            for (let c = 0; c < this.qAmount; c++) {
                this.available[r][c] = true;
            }
        }
    }
    selectQuestion(cat, no) {
        if (!this.available[cat][no]) return -1;//not available
        this.available[cat][no] = false;
        return this.getQuestion(cat, no);
    }
    getQuestion(cat, no) {
        let q=this.questions[cat][no];
        if(this.images[cat]&&this.images[cat][no]){
            return {"question":q,"image":this.images[cat][no]['url'],"value":this.pointValues[no],"showWith":this.images[cat][no]['showWith']}
        }
        return {"question":q,"image":false,"value":this.pointValues[no],"showWith":false}
    }
    getAnswer(cat, no) {
        return this.answers[cat][no];
    }
    setFinalJeopardy(cqai) {//category,question,answer,image
        if (cqai.length < 3){
            this.finalJeopardyCategory=false;
            return false;
        } 
        this.finalJeopardyCategory=cqai[0];
        this.finalJeopardyQuestion = cqai[1];
        this.finalJeopardyAnswer = cqai[2];
        if(cqai.length>3)this.finalJeopardyImg=cqai[3];
        if(cqai.length>4)this.finalJeopardyShowWith=cqai[4];
        return true;
    }
    getFinalJeopardy_category(){
        return this.finalJeopardyCategory;
    }
    getFinalJeopardy_question() {
        return this.finalJeopardyQuestion;
    }
    getFinalJeopardy_answer() {
        return this.finalJeopardyAnswer;
    }
    getFinalJeopardyImage(){
        return (this.finalJeopardyImg)?{"image":this.finalJeopardyImg,"showWith":this.finalJeopardyShowWith}:false;
    }
    startTimer(time_ms, callback) {
        setTimeout(callback, time_ms);
    }
    newGamefromCSV_text(csvText) {
        let csv = Papa.parse(csvText).data;
        return this.newGameFrom2D(this.validResults(csv));
    }
    newGamefromCSV(csv,callback){
        // console.log(this.ignore);
        var that=this;
        Papa.parse(csv, {
            complete: function(results){
                that.newGameFrom2D(that.validResults(results.data));
                callback();
            }
        });
    }
    validResults(data){
        // console.log(this.ignore);
        for(let i=0;i<data.length;i++){
            data[i]=data[i].filter(el=>el.length>0&&el.indexOf(this.ignore)!==0);
        }
        return data;
    }
    newGameFrom2D(csv){
        let csv_categories=csv[0];
        if(csv[1].length%2==1)return false;//every question must have an answer
        let qAmt=csv[1].length/2;
        let questions=[];
        let answers=[];
        for(let i=0;i<csv_categories.length;i++){
            questions[i]=[];
            answers[i]=[];
            for(let j=0;j<csv[i+1].length;j++){
                if(j<qAmt){
                    questions[i].push(csv[i+1][j]);
                }else{
                    answers[i].push(csv[i+1][j]);
                }
            }
        }
        csv=csv.slice(csv_categories.length+1,csv.length);
        //remaining: points, final jeopardy, images
        let points=[];
        if(csv[0].length>=1){
            points=csv[0].slice();
        }
        csv=csv.slice(1,csv.length);
        let fJeopardy=[];
        if(csv[0].length>=3){
            fJeopardy=csv[0];
        }
        csv=csv.slice(1,csv.length);
        //process images
        let images=csv;
        return this.newGame(questions,answers,csv_categories,points,fJeopardy,images);
    }
    newGame(qArr, aArr, cat, pt, fJeopardy,images) {
        // console.log(qArr);
        // console.log(aArr);
        // console.log(cat);
        // console.log(pt);
        // console.log(fJeopardy);
        // console.log(images);
        this.images=[];
        let qAmt = this.setQuestions(qArr);
        let aAmt = this.setAnswers(aArr);
        let catAmt = this.setCategories(cat);
        let ptAmt = this.setPointValues(pt);
        if (!checkEqual([qAmt, aAmt, ptAmt])) {
            return false;//uneven amounts submitted
        }
        this.setFinalJeopardy(fJeopardy);
        this.setImages(images);
        return true;//game begins.
    }

}
function checkEqual(arr) {
    if (arr.length < 1) return true;
    let first = arr[0];
    for (let i = 1; i < arr.length; i++) {
        if (arr[i] !== first) return false;
    }
    return true;
}
