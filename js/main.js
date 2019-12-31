let jGame = new Jeopardy('//');
const colors = ["success", "danger", "warning", "info", "secondary", "primary"];
let numPlayers = 3;
let playerNames = ["Team 1", "Team 2", "Team 3"];
let timeToAnswer = 30;
let currentPlayer = 0;
let playersAnswered = 0;
let scores = [];
let fjstart = false;
let answerOpen=false;
let wagers = [];
let test;
let q, a, showImage, imageURL;//showImage values: question, answer, false
let gameDetails;
let halted = false;
let penalty = 1;
$(function () {
    $('#questionContainer').hide();
    setupNameSelector();
    $('#numPlayers').change(function(){
        setupNameSelector();
    })

    
    $('#fr').change(function (evt) {
        var file = evt.target.files[0];
        timeToAnswer = $('#questionTime').val();
        playerNames = [];
        for(let i = 0; i < numPlayers; i++) {
            playerNames.push($('#teamName_'+i).val());
        }
        jGame.newGamefromCSV(file, function () {
            populateTable();
            let numQuestions=jGame.getGameDetails().questionCount;
            let vhPer=parseInt(75.0/numQuestions);
            $('.body-cell').css('max-height',vhPer+'%')
        });
        answerOpen=document.getElementById("answerOpen").checked;
        setupScore();
        penalty = $('#wrongPenalty').val();
        disableScore();
        $('#inputContainer').hide();
        // populateTable();
    });
    $('#btn').click(function () {
        if (jGame.questionsLeft()) {
            $('#selectionContainer').show();
            $('#questionContainer').hide();
            halted = true;
            disableScore();
        } else {
            disableScore();

            $('#questionContainer').hide();
            beginFinalJeopardy();
        }
    })
    $('#fj_questionBtn').click(function () {
        for (let i = 0; i < numPlayers; i++) {
            wagers.push(parseInt($('#wager' + i).val()));
        }
        $('#fJ_category').hide();
        showFinalJeopardyQuestion();
    });
    $('#showFJ_answer').click(function () {
        enableRightWrongBtn();
        $('#showFJ_answer').hide();
        if (jGame.getFinalJeopardyImage()) {
            $('#fJ_img').show();
        }
        $('#fJ_answer').show();
    });
    $('#selectionContainer').on("click", "td", function () {
        let catIndex = this.getAttribute('cno');
        let qIndex = this.getAttribute('qno');
        this.innerText = "";
        q = jGame.selectQuestion(catIndex, qIndex);
        if (q == -1) {
            let result = confirm("Question already selected, click ok to proceed");
            if (!result) return;
            q = jGame.getQuestion(catIndex, qIndex);
        }
        a = jGame.getAnswer(catIndex, qIndex);
        console.log(a);//log to console so moderator can see answer :)
        playersAnswered = 0;
        updateQuestion();
        $('#selectionContainer').hide();
        $('#questionContainer').show();
    });
    $('#scoreContainer').on("click", ".rightBtn", function () {
        if (!fjstart) {
            $('.progress').hide(100);
            halted = true;
            currentPlayer = parseInt(this.getAttribute('team'));
            scores[currentPlayer] += parseInt(q.value);
            $('#teamScore' + currentPlayer).text(scores[currentPlayer]);
            updateAnswer();
        } else {
            playersAnswered++;
            currentPlayer = parseInt(this.getAttribute('team'));
            scores[currentPlayer] += wagers[currentPlayer];
            $('#teamScore' + currentPlayer).text(scores[currentPlayer]);
            if(playersAnswered==numPlayers)showWinner(true);
        }

    });
    $('#scoreContainer').on("click", ".passBtn", function () {
        playersAnswered++;
        disableScore();

        if (playersAnswered == numPlayers) {
            currentPlayer = (currentPlayer + 1) % numPlayers;
            $('.progress').hide(100);
            halted=true;
            updateAnswer();
        } else {
            enableScore((currentPlayer + playersAnswered) % numPlayers);
            // $('#currPlayer').text((currentPlayer + playersAnswered) % numPlayers + 1);
            flushProgressColors();
            $('.progress-bar').addClass("bg-" + colors[(currentPlayer + playersAnswered) % numPlayers]);
        }
    });
    $('#allPassBtn').click(function() {
        playersAnswered = numPlayers;
        disableScore();
        currentPlayer = (currentPlayer + 1) % numPlayers;
        $('.progress').hide(100);
        halted=true;
        updateAnswer();
    })
    $('#scoreContainer').on("click", ".wrongBtn", function () {
        if (!fjstart) {
            playersAnswered++;
            let thisPlayer = parseInt(this.getAttribute('team'));
            scores[thisPlayer] -= Math.floor(penalty * parseInt(q.value));
            $('#teamScore' + thisPlayer).text(scores[thisPlayer]);
            disableScore();

            if (playersAnswered == numPlayers) {
                $('.progress').hide(100);
                halted=true;
                currentPlayer = (currentPlayer + 1) % numPlayers;
                updateAnswer();
            } else {
                enableScore((currentPlayer + playersAnswered) % numPlayers);
                // $('#currPlayer').text((currentPlayer + playersAnswered) % numPlayers + 1);
                if(!answerOpen){
                    flushProgressColors();
                    $('.progress-bar').addClass("bg-" + colors[(currentPlayer + playersAnswered) % numPlayers]);
                }
                
            }
        } else {
            playersAnswered++;
            currentPlayer = parseInt(this.getAttribute('team'));
            scores[currentPlayer] -= wagers[currentPlayer];
            $('#teamScore' + currentPlayer).text(scores[currentPlayer]);
            if(playersAnswered==numPlayers)showWinner(true);
        }

    });
});
function setupScore() {
    let html = '<div class="row" style="width:100%">'
    for (let i = 0; i < numPlayers; i++) {
        scores.push(0);
        html += '<div class="col"><div class="card-special card"><div class="card-body">'
        html += '<h2 class="card-title">'
        html += playerNames[i];
        html += ': <span id="teamScore';
        html += i;
        html += '"</span>0</h2>';
        html += '<button class="btn btn-';
        html += colors[i % colors.length];
        html += ' rightBtn" team="';
        html += i;
        html += '">'
        html += '<img src="assets/open-iconic-master/svg/circle-check.svg" style="height:1.5rem" alt="Correct">'
        html += '</button>'
        html += '<button class="btn btn-';
        html += colors[i % colors.length];
        html += ' passBtn" team="';
        html += i;
        html += '">'
        html += '<img src="assets/open-iconic-master/svg/loop.svg" style="height:1.5rem" alt="Pass">'
        html += '</button>'
        html += '<button class="btn btn-';
        html += colors[i % colors.length];
        html += ' wrongBtn" team="';
        html += i;
        html += '">'
        html += '<img src="assets/open-iconic-master/svg/circle-x.svg" style="height:1.5rem" alt="Wrong">';
        html += '</button>'
        html += "</div></div></div>"
    }
    html += "</div>"
    $('#scoreContainer').html(html);

}
function enableRightWrongBtn() {
    $('.rightBtn').prop("disabled", false);
    $('.passBtn').prop("disabled",true);
    $('.wrongBtn').prop("disabled", false);
}

function enableScore(el) {
    if(el===true||answerOpen){
        $('.rightBtn').prop("disabled", false);
        $('.passBtn').prop("disabled",true);
        $('.wrongBtn').prop("disabled", false);
        return;
    }
    $('.rightBtn').each(function () {
        if (parseInt(this.getAttribute('team')) == el) {
            $(this).prop("disabled", false);
        }
    })
    if(!answerOpen){
        $('.passBtn').each(function () {
            if (parseInt(this.getAttribute('team')) == el) {
                $(this).prop("disabled", false);
            }
        })
    }
    
    $('.wrongBtn').each(function () {
        if (parseInt(this.getAttribute('team')) == el) {
            $(this).prop("disabled", false);
        }
    })
}
function disableScore() {
    $('.rightBtn').prop("disabled", true);
    $('.passBtn').prop("disabled", true);
    $('.wrongBtn').prop("disabled", true);
}
function beginTimer() {
    $(".progress").show(100);
    flushProgressColors();
    $('.progress-bar').addClass("bg-" + colors[currentPlayer]);
    halted = false;
    recursivelyProgress(timeToAnswer);

}
function flushProgressColors(){
    let maxFlush = colors.length;
    if (maxFlush > numPlayers) maxFlush = numPlayers;
    for (let i = 0; i < maxFlush; i++) {
        $('.progress-bar').removeClass("bg-" + colors[i]);
    }
}
function recursivelyProgress(t) {
    if (t > 0 && !halted) {
        if (t == timeToAnswer) $('.progress-bar').css('width', '100%').attr('aria-valuenow', 100);
        t -= 1;
        setTimeout(function () {
            let value = Math.round(100.0 * (t) / timeToAnswer);
            $('.progress-bar').css('width', value + '%').attr('aria-valuenow', value);
            recursivelyProgress(t);
        }, 1000)
    }

}
function updateQuestion() {
    beginTimer();
    enableScore(currentPlayer);
    $('#image').hide();
    $('#answer').hide();
    // $('#currPlayer').text(currentPlayer + 1);
    $('#question').html(q.question);
    if (q.image) {
        $('#image').attr("src", q.image);
    }
    if (q.showWith && q.showWith.toLowerCase() == "question") {
        $('#image').show();
    }
}
function updateAnswer() {
    $('#answer').show();
    if (q.showWith && q.showWith.toLowerCase() == "answer") $('#image').show();
    $('#answer').html(a);
}
function populateTable() {
    let html = '<table class="table table-big text-white"><thead><tr>';
    gameDetails = jGame.getGameDetails();
    for (let i = 0; i < gameDetails.categories.length; i++) {
        html += '<th class="head-cell" scope="col">';
        html += gameDetails.categories[i];
        html += '</th>'
    }
    html += '</thead></tr><tbody>';
    for (let pt = 0; pt < gameDetails.pointValues.length; pt++) {
        html += '<tr>'
        for (let cat = 0; cat < gameDetails.categories.length; cat++) {
            html += '<td class="body-cell" qno="';
            html += pt;
            html += '" cno="';
            html += cat;
            html += '">';
            html += gameDetails.pointValues[pt];
            html += '</td>';
        }
        html += '</tr>'
    }
    html += '</tbody></table>';

    $('#selectionContainer').html(html);

}
function beginFinalJeopardy() {
    if (!jGame.getFinalJeopardy_category()){
        showWinner(false);
        return;
    } 
    $('.passBtn').prop('disabled', true);
    fjstart = true;
    $('#fJ_category').show();
    $('#fJ_categoryText').html(jGame.getFinalJeopardy_category());
    let html = "";
    for (let i = 0; i < numPlayers; i++) {
        html += '<div class="row"><div class="col-6"><p>Wager for ';
        html += playerNames[i];
        html += '</p></div><div class="col-6"><input class="form-control" type="number" id="wager';
        html += i;
        html += '"></div></div>'
    }
    $('#wagers').html(html);
}
function showFinalJeopardyQuestion() {
    playersAnswered = 0;
    $('#fJ_questionContainer').show();
    $('#fJ_question').html(jGame.getFinalJeopardy_question());
    $('#fJ_answer').hide();
    $('#fJ_answer').html(jGame.getFinalJeopardy_answer());
    let fJ_img = jGame.getFinalJeopardyImage();
    if (fJ_img && fJ_img.showWith.toLowerCase() == "question") {
        $('#fJ_img').attr("src", fJ_img.image);
        $('#fJ_img').show();
    } else if (fJ_img) {
        $('#fJ_img').attr("src", fJ_img.image);
    }
}
function showWinner(final) {
    if (!final) {
        $('#showFJ_answer').hide();
        $('#fJ_questionContainer').show();
    }
    let fJ_img = jGame.getFinalJeopardyImage();
    if (fJ_img && fJ_img.showWith.toLowerCase() == "answer") {
        $('#fJ_img').show();
    }
    let winner = 0;
    let winningScore = scores[0];
    for (let i = 1; i < scores.length; i++) {
        if (scores[i] > winningScore) {
            winner = i;
            winningScore = scores[i];
        }
    }
    let winners=[];
    for (let i = 0; i < scores.length; i++) {
        if (scores[i] == winningScore) {
            winners.push(i);
        }
    }
    if(winners.length==1){
        $('.winner').text("Team " + playerNames[winner] + " won with a score of " + winningScore + " points!");
    }else{
        let winningNames = [];
        for(let i = 0; i < winners.length; i++) {
            winningNames.push(playerNames[winners[i]]);
        }
        $('.winner').text("Teams "+winningNames.join(', ')+" tied with a score of "+winningScore+ " points.");
    }
}

function setupNameSelector(){
    numPlayers = Math.floor($('#numPlayers').val());
    let playersHTML = "";
    for(let i = 0; i < numPlayers; i++) {
        playersHTML += '<input type="text" name="fname" value="Team ' + (i+1) + '" id="teamName_' + i + '"><br></br>'
    }
    $('#nameSelection').html(playersHTML);
}