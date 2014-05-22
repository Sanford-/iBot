(function(){

var storeToStorage = function(){
    localStorage.setItem("iBotRoomSettings", JSON.stringify(iBot.roomSettings));
    localStorage.setItem("iBotRoom", JSON.stringify(iBot.room));
    var iBotStorageInfo = {
        time: Date.now(),
        stored: true,
        version: iBot.version,
    };
    localStorage.setItem("iBotStorageInfo", JSON.stringify(iBotStorageInfo));

};

var retrieveFromStorage = function(){
    var info = localStorage.getItem("iBotStorageInfo");
    if(info === null) API.chatLog("Não existe dados para Carregar");
    else{
        var settings = JSON.parse(localStorage.getItem("iBotRoomSettings"));
        var room = JSON.parse(localStorage.getItem("iBotRoom"));
        var elapsed = Date.now() - JSON.parse(info).time;
        if((elapsed < 1*60*60*1000)){
            API.chatLog('Recuperando dados armazenados anteriormente...');
            iBot.room.users = room.users;
            iBot.room.afkList = room.afkList;
            iBot.room.historyList = room.historyList;
            iBot.room.mutedUsers = room.mutedUsers;
            iBot.room.autoskip = room.autoskip;
            iBot.room.roomstats = room.roomstats;
            iBot.room.messages = room.messages;
            API.chatLog('Dados previamente armazenados recuperados com sucesso.');
        }
    }
    var json_sett = null;
    var roominfo = document.getElementById("room-info");
    var info = roominfo.innerText;
    var ref_bot = "iBot=";
    var ind_ref = info.indexOf(ref_bot);
    if(ind_ref > 0){
        var link = info.substring(ind_ref + ref_bot.length, info.length);
        if(link.indexOf(" ") < link.indexOf("\n")) var ind_space = link.indexOf(" ");
        else var ind_space = link.indexOf("\n");
        link = link.substring(0,ind_space);
        $.get(link, function(json){
            if(json !== null && typeof json !== "undefined"){
                var json_sett = JSON.parse(json);
                for(var prop in json_sett){
                    iBot.roomSettings[prop] = json_sett[prop];
                }
            }
        });
    }

};

var iBot = {
        version: "1.0.10",        
        status: false,
        name: "iBot",
        creator: "-TheMars",
        loggedInID: null,
        scriptLink: "http://goo.gl/9d8R9u",
        chatbotLink: "https://raw.githubusercontent.com/Noceutempao/TheMars-ChatBOT/master/Chatbot%20code2",
        cmdLink: "http://goo.gl/GXWBoh",
        roomSettings: {
            maximumAfk: 120,
            afkRemoval: false,                
            maximumDc: 60,                                
            bouncerPlus: false,                
            lockdownEnabled: false,                
            lockGuard: false,
            maximumLocktime: 10,                
            cycleGuard: true,
            maximumCycletime: 10,                
            timeGuard: true,
            maximumSongLength: 6,                
            autodisable: true,                
            commandCooldown: 30,
            usercommandsEnabled: true,                
            lockskipPosition: 1,
            lockskipReasons: [ ["theme", "Esta musica não se encaixa nos tema da sala. "], 
                    ["op", "Esta musica esta na lista de OP. "], 
                    ["history", "Esta musica esta no histórico. "], 
                    ["mix", "Você tocou uma musica, que é contra as regras. "], 
                    ["sound", "A musica que você tocou teve má qualidade do som ou sem som. "],
                    ["nsfw", "A Musica contia NSFW (de imagem ou de som). "], 
                    ["unavailable", "A musica que você tocou não estava disponível para alguns usuários. "] 
                ],
            afkpositionCheck: 15,
            afkRankCheck: "ambassador",                
            motdEnabled: false,
            motdInterval: 5,
            motd: ["/meNão se esqueça de votar para não ser removido da lista de espera!!"],                
            filterChat: false,
            etaRestriction: false,
            welcome: false,
            opLink: "",
            rulesLink: "http://goo.gl/YHh6mZ",
            themeLink: "http://goo.gl/nA1t55",
            fbLink: "http://goo.gl/z5Nxul",
            youtubeLink: null,
            website: "http://goo.gl/bGP1Yf",
            intervalMessages: [],
            messageInterval: 5,                      
        },        
        room: {        
            users: [],                
            afkList: [],                
            mutedUsers: [],
            bannedUsers: [],
            skippable: true,
            usercommand: true,
            allcommand: true,   
            afkInterval: null,
            autoskip: false,
            autoskipTimer: null,
            autodisableInterval: null,
            autodisableFunc: function(){
                if(iBot.status && iBot.roomSettings.autodisable){
                    //API.sendChat('/meNão se esqueça de votar para não ser removido da lista de espera...');
                }
            },
            queueing: 0,
            queueable: true,
            currentDJID: null,
            historyList: [],
            cycleTimer: setTimeout(function(){},1),                
            roomstats: {
                    accountName: null,
                    totalWoots: 0,
                    totalCurates: 0,
                    totalMehs: 0,
                    launchTime: null,
                    songCount: 0,
                    chatmessages: 0,                
            },
            messages: {
                from: [],
                to: [],
                message: [],
            },                
            queue: {
                    id: [],
                    position: [],                             
            },
            roulette: {
                rouletteStatus: false,
                participants: [],
                countdown : null,
                startRoulette: function(){
                    iBot.room.roulette.rouletteStatus = true;
                    iBot.room.roulette.countdown = setTimeout(function(){ iBot.room.roulette.endRoulette(); }, 60 * 1000);
                    API.sendChat("/meA roleta foi iniciada! digite !join para participar, caso mude de ideia digite !leave para sair! :warning:");
                },
                endRoulette: function(){
                    iBot.room.roulette.rouletteStatus = false;
                    var ind = Math.floor(Math.random() * iBot.room.roulette.participants.length);
                    var winner = iBot.room.roulette.participants[ind];
                    iBot.room.roulette.participants = [];
                    var pos = Math.floor((Math.random() * API.getWaitList().length) + 1);
                    var user = iBot.userUtilities.lookupUser(winner);
                    var name = user.username;
                    API.sendChat("/me Um vencedor foi escolhido! [" + name + "] para posição " + pos + ".");
                    setTimeout(function(winner){
                        iBot.userUtilities.moveUser(winner, pos, false);
                    }, 1*1000, winner, pos);

                },
            },
        },        
        User: function(id, name) {
            this.id = id;
            this.username = name;        
            this.jointime = Date.now();
            this.lastActivity = Date.now();         
            this.votes = {
                    woot: 0,
                    meh: 0,
                    curate: 0,
            };
            this.lastEta = null;            
            this.afkWarningCount = 0;            
            this.afkCountdown;            
            this.inRoom = true;            
            this.isMuted = false;
            this.lastDC = {
                    time: null,
                    position: null,
                    songCount: 0,
            };
            this.lastKnownPosition = null;       
        },      
        userUtilities: {
            getJointime: function(user){
                return user.jointime;
                },                        
            getUser: function(user){
                return API.getUser(user.id);
                },
            updatePosition: function(user, newPos){
                    user.lastKnownPosition = newPos;
                },                      
            updateDC: function(user){
                user.lastDC.time = Date.now();
                user.lastDC.position = user.lastKnownPosition;
                user.lastDC.songCount = iBot.room.roomstats.songCount;
                },                
            setLastActivity: function(user) {
                user.lastActivity = Date.now();
                user.afkWarningCount = 0;
                clearTimeout(user.afkCountdown);          
                },                        
            getLastActivity: function(user) {
                return user.lastActivity;
                },                        
            getWarningCount: function(user) {
                return user.afkWarningCount;
                },                        
            setWarningCount: function(user, value) {
                user.afkWarningCount = value;
                },        
            lookupUser: function(id){
                for(var i = 0; i < iBot.room.users.length; i++){
                        if(iBot.room.users[i].id === id){                                        
                                return iBot.room.users[i];
                        }
                }
                return false;
            },                
            lookupUserName: function(name){
                for(var i = 0; i < iBot.room.users.length; i++){
                        if(iBot.userUtilities.getUser(iBot.room.users[i]).username === name){
                            return iBot.room.users[i];
                        }
                }
                return false;
            },                
            voteRatio: function(id){
                var user = iBot.userUtilities.lookupUser(id);
                var votes = user.votes;
                if(votes.meh=== 0) votes.ratio = 1;
                else votes.ratio = (votes.woot / votes.meh).toFixed(2);
                return votes;
            
            },                
            getPermission: function(id){ //1 requests
                var u = API.getUser(id);
                return u.permission;
            },                
            moveUser: function(id, pos, priority){
                var user = iBot.userUtilities.lookupUser(id);
                var wlist = API.getWaitList();
                if(API.getWaitListPosition(id) === -1){                    
                    if (wlist.length < 50){
                        API.moderateAddDJ(id);
                        if (pos !== 0) setTimeout(function(id, pos){ 
                            API.moderateMoveDJ(id, pos);        
                        },1250, id, pos);
                    }                            
                    else{
                        var alreadyQueued = -1;
                        for (var i = 0; i < iBot.room.queue.id.length; i++){
                                if(iBot.room.queue.id[i] === id) alreadyQueued = i;
                        }
                        if(alreadyQueued !== -1){
                            iBot.room.queue.position[alreadyQueued] = pos;
                            return API.sendChat('/me O usuário já esta sendo adicionado! Mudou a posição desejada para ' + iBot.room.queue.position[alreadyQueued] + '.');
                        }
                        iBot.roomUtilities.booth.lockBooth();
                        if(priority){
                            iBot.room.queue.id.unshift(id);
                            iBot.room.queue.position.unshift(pos);
                        }
                        else{
                            iBot.room.queue.id.push(id);
                            iBot.room.queue.position.push(pos);
                        }
                        var name = user.username;
                        return API.sendChat('/me Adicionado ' + name + ' para a lista de djs. Fila atual: ' + iBot.room.queue.position.length + '.');
                    }
                }
                else API.moderateMoveDJ(id, pos);                    
            },        
            dclookup: function(id){
                var user = iBot.userUtilities.lookupUser(id);                        
                if(typeof user === 'boolean') return ('/me Usuário não encontrado.');
                var name = user.username;
                if(user.lastDC.time === null) return ('/me ' + name + ' Eu não vi você se desconectar :(');
                var dc = user.lastDC.time;
                var pos  = user.lastDC.position;
                if(pos === null) return ("/me A lista de espera precisa atualizar pelo menos uma vez para registrar a última posição do usuário.");
                var timeDc = Date.now() - dc;
                var validDC = false;
                if(iBot.roomSettings.maximumDc * 60 * 1000 > timeDc){
                    validDC = true;
                }                        
                var time = iBot.roomUtilities.msToStr(timeDc);
                if(!validDC) return ("/me " + iBot.userUtilities.getUser(user).username + "Você esta Desconectado a muito tempo: " + time + ".");
                var songsPassed = iBot.room.roomstats.songCount - user.lastDC.songCount;
                var afksRemoved = 0;
                var afkList = iBot.room.afkList;
                for(var i = 0; i < afkList.length; i++){
                    var timeAfk = afkList[i][1];
                    var posAfk = afkList[i][2];
                    if(dc < timeAfk && posAfk < pos){
                            afksRemoved++;
                    }
                }
                var newPosition = user.lastDC.position - songsPassed - afksRemoved;
                if(newPosition <= 0) newPosition = 1;
                var msg = '/me ' + iBot.userUtilities.getUser(user).username + ' desconectado ' + time + ' atras, atrás na posição ' + newPosition + '.';
                iBot.userUtilities.moveUser(user.id, newPosition, true);
                return msg;             
            },              
        },
        
        roomUtilities: {
            rankToNumber: function(rankString){
                var rankInt = null;
                switch (rankString){
                    case "admin":           rankInt = 10;   break;
                    case "ambassador":      rankInt = 8;    break;
                    case "host":            rankInt = 5;    break;
                    case "cohost":          rankInt = 4;    break;
                    case "manager":         rankInt = 3;    break;
                    case "bouncer":         rankInt = 2;    break;
                    case "residentdj":      rankInt = 1;    break;
                    case "user":            rankInt = 0;    break;
                }
                return rankInt;
            },        
            msToStr: function(msTime){
                var ms, msg, timeAway;
                msg = '';
                timeAway = {
                  'days': 0,
                  'hours': 0,
                  'minutes': 0,
                  'seconds': 0
                };
                ms = {
                  'day': 24 * 60 * 60 * 1000,
                  'hour': 60 * 60 * 1000,
                  'minute': 60 * 1000,
                  'second': 1000
                };                        
                if (msTime > ms.day) {
                  timeAway.days = Math.floor(msTime / ms.day);
                  msTime = msTime % ms.day;
                }
                if (msTime > ms.hour) {
                  timeAway.hours = Math.floor(msTime / ms.hour);
                  msTime = msTime % ms.hour;
                }
                if (msTime > ms.minute) {
                  timeAway.minutes = Math.floor(msTime / ms.minute);
                  msTime = msTime % ms.minute;
                }
                if (msTime > ms.second) {
                  timeAway.seconds = Math.floor(msTime / ms.second);
                }                        
                if (timeAway.days !== 0) {
                  msg += timeAway.days.toString() + 'd';
                }
                if (timeAway.hours !== 0) {
                  msg += timeAway.hours.toString() + 'h';
                }
                if (timeAway.minutes !== 0) {
                  msg += timeAway.minutes.toString() + 'm';
                }
                if (timeAway.minutes < 1 && timeAway.hours < 1 && timeAway.days < 1) {
                  msg += timeAway.seconds.toString() + 's';
                }
                if (msg !== '') {
                  return msg;
                } else {
                  return false;
                }                       
            },                
            booth:{                
                lockTimer: setTimeout(function(){},1000),                        
                locked: false,                        
                lockBooth: function(){
                    API.moderateLockWaitList(!iBot.roomUtilities.booth.locked);
                    iBot.roomUtilities.booth.locked = false;
                    if(iBot.roomSettings.lockGuard){
                        iBot.roomUtilities.booth.lockTimer = setTimeout(function (){
                            API.moderateLockWaitList(iBot.roomUtilities.booth.locked);
                        },iBot.roomSettings.maximumLocktime * 60 * 1000);
                    };                        
                },                        
                unlockBooth: function() {
                  API.moderateLockWaitList(iBot.roomUtilities.booth.locked);
                  clearTimeout(iBot.roomUtilities.booth.lockTimer);
                },                
            },                
            afkCheck: function(){
                if(!iBot.status || !iBot.roomSettings.afkRemoval) return void (0);
                    var rank = iBot.roomUtilities.rankToNumber(iBot.roomSettings.afkRankCheck);
                    var djlist = API.getWaitList();
                    var lastPos = Math.min(djlist.length , iBot.roomSettings.afkpositionCheck);
                    if(lastPos - 1 > djlist.length) return void (0);
                    for(var i = 0; i < lastPos; i++){
                        if(typeof djlist[i] !== 'undefined'){
                            var id = djlist[i].id;
                            var user = iBot.userUtilities.lookupUser(id);
                            if(typeof user !== 'boolean'){
                                var plugUser = iBot.userUtilities.getUser(user);
                                if(rank !== null && plugUser.permission <= rank){
                                    var name = plugUser.username;
                                    var lastActive = iBot.userUtilities.getLastActivity(user);
                                    var inactivity = Date.now() - lastActive;
                                    var time = iBot.roomUtilities.msToStr(inactivity);
                                    var warncount = user.afkWarningCount;
                                    if (inactivity > iBot.roomSettings.maximumAfk * 60 * 1000 ){
                                        if(warncount === 0){
                                            API.sendChat('/me [' + name + '], Você esta AFK por' + time + ', Dentro de 2 minutos responda no chat ou sera Removido da lista de espera');
                                            user.afkWarningCount = 3;
                                            user.afkCountdown = setTimeout(function(userToChange){
                                                userToChange.afkWarningCount = 1; 
                                            }, 90 * 1000, user);
                                        }
                                        else if(warncount === 1){
                                            API.sendChat("/me [" + name + "], Ultimo aviso se você não responder Sera Removido!.");
                                            user.afkWarningCount = 3;
                                            user.afkCountdown = setTimeout(function(userToChange){
                                                userToChange.afkWarningCount = 2;
                                            }, 30 * 1000, user);
                                        }
                                        else if(warncount === 2){
                                            var pos = API.getWaitListPosition(id);
                                            if(pos !== -1){
                                                pos++;
                                                iBot.room.afkList.push([id, Date.now(), pos]);
                                                API.moderateRemoveDJ(id);
                                                API.sendChat('/me [' + name + '], Você foi removido por estar afk por: ' + time + '. Você estava na posição ' + pos + '. Converse pelo menos uma vez a cada' + iBot.roomSettings.maximumAfk + ' minutos se você quiser tocar uma musica!.');
                                            }
                                            user.afkWarningCount = 0;
                                        };
                                    }
                                }
                            }
                        }
                    }                
            },                
            changeDJCycle: function(){
                var toggle = $(".cycle-toggle");
                if(toggle.hasClass("disabled")) {
                    toggle.click();
                    if(iBot.roomSettings.cycleGuard){
                    iBot.room.cycleTimer = setTimeout(function(){
                            if(toggle.hasClass("enabled")) toggle.click();
                            }, iBot.roomSettings.cycleMaxTime * 60 * 1000);
                    }        
                }
                else {
                    toggle.click();
                    clearTimeout(iBot.room.cycleTimer);
                }        
            },
            intervalMessage: function(){
                var interval;
                if(iBot.roomSettings.motdEnabled) interval = iBot.roomSettings.motdInterval;
                else interval = iBot.roomSettings.messageInterval;
                if((iBot.room.roomstats.songCount % interval) === 0 && iBot.status){
                    var msg;
                    if(iBot.roomSettings.motdEnabled){
                        msg = iBot.roomSettings.motd;
                    }
                    else{
                        if(iBot.roomSettings.intervalMessages.length === 0) return void (0);
                        var messageNumber = iBot.room.roomstats.songCount % iBot.roomSettings.intervalMessages.length;
                        msg = iBot.roomSettings.intervalMessages[messageNumber];
                    };                              
                    API.sendChat('/me ' + msg);
                }
            },      
        },        
        eventChat: function(chat){
            for(var i = 0; i < iBot.room.users.length;i++){
                if(iBot.room.users[i].id === chat.fromID){
                        iBot.userUtilities.setLastActivity(iBot.room.users[i]);
                        if(iBot.room.users[i].username !== chat.from){
                                iBot.room.users[i].username = chat.from;
                        }
                }                            
            }                        
            if(iBot.chatUtilities.chatFilter(chat)) return void (0);
            if( !iBot.chatUtilities.commandCheck(chat) ) 
                    iBot.chatUtilities.action(chat);             
        },        
        eventUserjoin: function(user){
            var known = false;
            var index = null;
            for(var i = 0; i < iBot.room.users.length;i++){
                if(iBot.room.users[i].id === user.id){
                        known = true;
                        index = i;
                }
            }
            var greet = true;
            if(known){
                iBot.room.users[index].inRoom = true;
                var u = iBot.userUtilities.lookupUser(user.id);
                var jt = u.jointime;
                var t = Date.now() - jt;
                if(t < 10*1000) greet = false;
                else var welcome = "Bem vindo de volta, ";
            }
            else{
                iBot.room.users.push(new iBot.User(user.id, user.username));
                var welcome = "Bem-vindo, ";
            }    
            for(var j = 0; j < iBot.room.users.length;j++){
                if(iBot.userUtilities.getUser(iBot.room.users[j]).id === user.id){
                    iBot.userUtilities.setLastActivity(iBot.room.users[j]);
                    iBot.room.users[j].jointime = Date.now();
                }
            
            }
            if(iBot.roomSettings.welcome && greet){
                setTimeout(function(){
                    API.sendChat("/me " + welcome + "" + user.username + ".");
                }, 1*1000);
            }               
        },        
        eventUserleave: function(user){
            for(var i = 0; i < iBot.room.users.length;i++){
                if(iBot.room.users[i].id === user.id){
                        iBot.userUtilities.updateDC(iBot.room.users[i]);
                        iBot.room.users[i].inRoom = false;
                }
            }
        },        
        eventVoteupdate: function(obj){
            for(var i = 0; i < iBot.room.users.length;i++){
                if(iBot.room.users[i].id === obj.user.id){
                    if(obj.vote === 1){
                        iBot.room.users[i].votes.woot++;
                    }
                    else{
                        iBot.room.users[i].votes.meh++;                                        
                    }
                }
            }               
        },        
        eventCurateupdate: function(obj){
            for(var i = 0; i < iBot.room.users.length;i++){
                if(iBot.room.users[i].id === obj.user.id){
                    iBot.room.users[i].votes.curate++;
                }
            }       
        },        
        eventDjadvance: function(obj){                
            var lastplay = obj.lastPlay;
            if(typeof lastplay === 'undefined') return void (0);
            iBot.room.roomstats.totalWoots += lastplay.score.positive;
            iBot.room.roomstats.totalMehs += lastplay.score.negative;
            iBot.room.roomstats.totalCurates += lastplay.score.curates;
            iBot.room.roomstats.songCount++;
            iBot.roomUtilities.intervalMessage();
            iBot.room.currentDJID = API.getDJ().id;
            var alreadyPlayed = false;
            for(var i = 0; i < iBot.room.historyList.length; i++){
                if(iBot.room.historyList[i][0] === obj.media.cid){
                    var firstPlayed = iBot.room.historyList[i][1];
                    var plays = iBot.room.historyList[i].length - 1;
                    var lastPlayed = iBot.room.historyList[i][plays];
                    var now = +new Date();
                    var interfix = '';
                    if(plays > 1) interfix = 's'
                    API.sendChat('/me :repeat: Esta musica foi tocada ' + plays + ' vez(s)' + interfix + ' nos últimos ' + iBot.roomUtilities.msToStr(Date.now() - firstPlayed) + ', última vez tocada foi a' + iBot.roomUtilities.msToStr(Date.now() - lastPlayed) + ' atras. :repeat: ');

                    iBot.room.historyList[i].push(+new Date());
                    alreadyPlayed = true;
                }
            }
            if(!alreadyPlayed){
                iBot.room.historyList.push([obj.media.cid, +new Date()]);
            }
            iBot.room.historyList;
            var newMedia = obj.media;
            if(iBot.roomSettings.timeGuard && newMedia.duration > iBot.roomSettings.maximumSongLength*60  && !iBot.room.roomevent){
                var name = obj.dj.username;
                API.sendChat('/me [' + name + '], sua musica tem mais do que ' + iBot.roomSettings.maximumSongLength + ' minutos, você precisa de permissão para tocar musicas mais longas.');
                API.moderateForceSkip();
            }
            var user = iBot.userUtilities.lookupUser(obj.dj.id);
            if(user.ownSong){
                API.sendChat('/me :up: ' + user.username + ' tem permissão para tocar a sua própria produção!');
                user.ownSong = false;
            }
            user.lastDC.position = null;
            clearTimeout(iBot.room.autoskipTimer);
            if(iBot.room.autoskip){
                var remaining = media.duration * 1000; 
                iBot.room.autoskipTimer = setTimeout(function(){ API.moderateForceSkip(); }, remaining - 500);
            }
            storeToStorage();

        },
        eventWaitlistupdate: function(users){
            if(users.length < 50){
                if(iBot.room.queue.id.length > 0 && iBot.room.queueable){
                    iBot.room.queueable = false;
                    setTimeout(function(){iBot.room.queueable = true;}, 500);
                    iBot.room.queueing++;
                    var id, pos;
                    setTimeout(
                        function(){
                            id = iBot.room.queue.id.splice(0,1)[0];
                            pos = iBot.room.queue.position.splice(0,1)[0];
                            API.moderateAddDJ(id,pos);
                            setTimeout(
                                function(id, pos){
                                API.moderateMoveDJ(id, pos);
                                iBot.room.queueing--;
                                if(iBot.room.queue.id.length === 0) setTimeout(function(){
                                    iBot.roomUtilities.booth.unlockBooth();
                                },1000);
                            },1000,id,pos);
                    },1000 + iBot.room.queueing * 2500);
                }
            }            
            for(var i = 0; i < users.length; i++){
                var user = iBot.userUtilities.lookupUser(users[i].id)
                iBot.userUtilities.updatePosition(user, users[i].wlIndex + 1);
            }
        },
        chatcleaner: function(chat){
            if(!iBot.roomSettings.filterChat) return false;
            if(iBot.userUtilities.getPermission(chat.fromID) > 1) return false;
            var msg = chat.message;
            var containsLetters = false;
            for(var i = 0; i < msg.length; i++){
                ch = msg.charAt(i);
                if((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || (ch >= '0' && ch <= '9') || ch === ':' || ch === '^') containsLetters = true;
            }
            if(msg === ''){
                return true;
            }
            if(!containsLetters && (msg.length === 1 || msg.length > 3)) return true;
            msg = msg.replace(/[ ,;.:\/=~+%^*\-\\"'&#]/g,'');
            var capitals = 0;
            var ch;
            for(var i = 0; i < msg.length; i++){
                ch = msg.charAt(i);
                if(ch >= 'A' && ch <= 'Z') capitals++;
            }
            if(capitals >= 15){
                API.sendChat("/me [" + chat.from + "] Por favor não use caps, obrigado.");
                return true;
            }
            msg = msg.toLowerCase();
            if(msg === 'skip'){
                    API.sendChat("/me [" + chat.from + "], Não peça para pular.");
                    return true;
                    }
            for (var j = 0; j < iBot.chatUtilities.spam.length; j++){
                if(msg === iBot.chatUtilities.spam[j]){
                    API.sendChat("/me [" + chat.from + "], Por favor não faça spam, obrigado.");
                    return true;
                    }
                }
            for (var i = 0; i < iBot.chatUtilities.beggarSentences.length; i++){
                if(msg.indexOf(iBot.chatUtilities.beggarSentences[i]) >= 0){
                    API.sendChat("/me [" + chat.from + "], por favor não peça fans.");
                    return true;
                }
            } 
            return false;
        },        
        chatUtilities: {        
            chatFilter: function(chat){
                var msg = chat.message;
                var perm = iBot.userUtilities.getPermission(chat.fromID);
                var user = iBot.userUtilities.lookupUser(chat.fromID);
                var isMuted = false;
                for(var i = 0; i < iBot.room.mutedUsers.length; i++){
                                if(iBot.room.mutedUsers[i] === chat.fromID) isMuted = true;
                        }
                if(isMuted){
                    API.moderateDeleteChat(chat.chatID);
                    return true;
                    };
                if(iBot.roomSettings.lockdownEnabled){
                                if(perm === 0){    
                                        API.moderateDeleteChat(chat.chatID);
                                        return true;
                                }
                        };
                if(iBot.chatcleaner(chat)){
                    API.moderateDeleteChat(chat.chatID);
                    return true;
                }
                var plugRoomLinkPatt, sender;
                    plugRoomLinkPatt = /(\bhttps?:\/\/(www.)?plug\.dj[-A-Z0-9+&#\/%?=~_|!:,.;]*[-A-Z0-9+&#\/%=~_|])/ig;
                    if (plugRoomLinkPatt.exec(msg)) {
                      sender = API.getUser(chat.fromID);
                      if (perm === 0) {                                                              
                              API.sendChat("/me " + chat.from + ", Não mande links de outras salas");
                              API.moderateDeleteChat(chat.chatID);
                              return true;
                      }
                    }
                if(msg.indexOf('http://adf.ly/') > -1){
                    API.moderateDeleteChat(chat.chatID);
                    API.sendChat('/me [' + chat.from + '], Por favor, mude seu autowoot. Sugerimos PlugCubed: http://plugcubed.net/');
                    return true;
                }                    
                if(msg.indexOf('autojoin não foi ativado') > 0 || msg.indexOf('Mensagem de AFK não foi ativada') > 0 || msg.indexOf('!afkdisable') > 0 || msg.indexOf('!joindisable') > 0 || msg.indexOf('autojoin disabled') > 0 || msg.indexOf('AFK message disabled') > 0){ 
                    API.moderateDeleteChat(chat.chatID);
                    return true;
                }                       
            return false;                        
            },                        
            commandCheck: function(chat){
                var cmd;
                if(chat.message.charAt(0) === '!'){
                        var space = chat.message.indexOf(' ');
                        if(space === -1){
                                cmd = chat.message;
                        }
                        else cmd = chat.message.substring(0,space);
                }
                else return false;
                var userPerm = iBot.userUtilities.getPermission(chat.fromID);
                if(chat.message !== "!join" && chat.message !== "!leave"){                            
                    if(userPerm === 0 && !iBot.room.usercommand) return void (0);
                    if(!iBot.room.allcommand) return void (0);
                }                            
                if(chat.message === '!eta' && iBot.roomSettings.etaRestriction){
                    if(userPerm < 2){
                        var u = iBot.userUtilities.lookupUser(chat.fromID);
                        if(u.lastEta !== null && (Date.now() - u.lastEta) < 1*60*60*1000){
                            API.moderateDeleteChat(chat.chatID);
                            return void (0);
                        }
                        else u.lastEta = Date.now();
                    }
                }                            
                var executed = false;                            
                switch(cmd){
                    case '!active':             iBot.commands.activeCommand.functionality(chat, '!active');                        executed = true; break;
                    case '!add':                iBot.commands.addCommand.functionality(chat, '!add');                              executed = true; break;
                     case "pontos": API.sendChat ("" + data.from +" :+1: "+ API.getUser(data.fromID).listenerPoints +" | :sound: "+ API.getUser(data.fromID).djPoints +" | :star: "+ API.getUser(data.fromID).curatorPoints +"."); break;
                    case '!afklimit':           iBot.commands.afklimitCommand.functionality(chat, '!afklimit');                    executed = true; break;
                    case '!afkremoval':         iBot.commands.afkremovalCommand.functionality(chat, '!afkremoval');                executed = true; break;
                    case '!afkreset':           iBot.commands.afkresetCommand.functionality(chat, '!afkreset');                    executed = true; break;
                    case '!afktime':            iBot.commands.afktimeCommand.functionality(chat, '!afktime');                      executed = true; break;
                    case '!autoskip':           iBot.commands.autoskipCommand.functionality(chat, '!autoskip');                    executed = true; break;
                    case '!autowoot':           iBot.commands.autowootCommand.functionality(chat, '!autowoot');                    executed = true; break;
                    case '!ba':                 iBot.commands.baCommand.functionality(chat, '!ba');                                executed = true; break;
                    case '!pontos':                 iBot.commands.pontosCommand.functionality(chat, '!pontos');                                executed = true; break;
                    case '!ban':                iBot.commands.banCommand.functionality(chat, '!ban');                              executed = true; break;
                    case '!bouncer+':           iBot.commands.bouncerPlusCommand.functionality(chat, '!bouncer+');                 executed = true; break;
                    case '!clearchat':          iBot.commands.clearchatCommand.functionality(chat, '!clearchat');                  executed = true; break;
                    case '!comandos':           iBot.commands.commandsCommand.functionality(chat, '!comandos');                    executed = true; break;
                    case '!cookie':             iBot.commands.cookieCommand.functionality(chat, '!cookie');                        executed = true; break;
                    case '!cycle':              iBot.commands.cycleCommand.functionality(chat, '!cycle');                          executed = true; break;
                    case '!cycleguard':         iBot.commands.cycleguardCommand.functionality(chat, '!cycleguard');                executed = true; break;
                    case '!cycletimer':         iBot.commands.cycletimerCommand.functionality(chat, '!cycletimer');                executed = true; break;
                    case '!dc':           iBot.commands.dclookupCommand.functionality(chat, '!dc');                    executed = true; break;
                    case '!emoji':              iBot.commands.emojiCommand.functionality(chat, '!emoji');                          executed = true; break;
                    case '!english':            iBot.commands.englishCommand.functionality(chat, '!english');                      executed = true; break;
                    case '!eta':                iBot.commands.etaCommand.functionality(chat, '!eta');                              executed = true; break;
                    case '!fb':                 iBot.commands.fbCommand.functionality(chat, '!fb');                                executed = true; break;
                    case '!filter':             iBot.commands.filterCommand.functionality(chat, '!filter');                        executed = true; break;
                    case '!join':               iBot.commands.joinCommand.functionality(chat, '!join');                            executed = true; break;
                    case '!jointime':           iBot.commands.jointimeCommand.functionality(chat, '!jointime');                    executed = true; break;
                    case '!kick':               iBot.commands.kickCommand.functionality(chat, '!kick');                            executed = true; break;
                    case '!kill':               iBot.commands.killCommand.functionality(chat, '!kill');                            executed = true; break;
                    case '!leave':              iBot.commands.leaveCommand.functionality(chat, '!leave');                          executed = true; break;
                    case '!link':               iBot.commands.linkCommand.functionality(chat, '!link');                            executed = true; break;
                    case '!lock':               iBot.commands.lockCommand.functionality(chat, '!lock');                            executed = true; break;
                    case '!lockdown':           iBot.commands.lockdownCommand.functionality(chat, '!lockdown');                    executed = true; break;
                    case '!lockguard':          iBot.commands.lockguardCommand.functionality(chat, '!lockguard');                  executed = true; break;
                    case '!lockskip':           iBot.commands.lockskipCommand.functionality(chat, '!lockskip');                    executed = true; break;
                    case '!lockskippos':        iBot.commands.lockskipposCommand.functionality(chat, '!lockskippos');              executed = true; break;
                    case '!locktimer':          iBot.commands.locktimerCommand.functionality(chat, '!locktimer');                  executed = true; break;
                    case '!maxlength':          iBot.commands.maxlengthCommand.functionality(chat, '!maxlength');                  executed = true; break;
                    case '!motd':               iBot.commands.motdCommand.functionality(chat, '!motd');                            executed = true; break;
                    case '!twitter':               iBot.commands.twitterCommand.functionality(chat, '!twitter');                            executed = true; break;
                    case '!move':               iBot.commands.moveCommand.functionality(chat, '!move');                            executed = true; break;
                    case '!mute':               iBot.commands.muteCommand.functionality(chat, '!mute');                            executed = true; break;
                    case '!op':                 iBot.commands.opCommand.functionality(chat, '!op');                                executed = true; break;
                    case '!ping':               iBot.commands.pingCommand.functionality(chat, '!ping');                            executed = true; break;
                    case '!reload':             iBot.commands.reloadCommand.functionality(chat, '!reload');                        executed = true; break;
                    case '!remove':             iBot.commands.removeCommand.functionality(chat, '!remove');                        executed = true; break;
                    case '!antiBot':             iBot.commands.antiBotCommand.functionality(chat, '!antiBot');                        executed = true; break;
                    case '!refresh':            iBot.commands.refreshCommand.functionality(chat, '!refresh');                      executed = true; break;
                    case '!restricteta':        iBot.commands.restrictetaCommand.functionality(chat, '!restricteta');              executed = true; break;
                    case '!roleta':           iBot.commands.rouletteCommand.functionality(chat, '!roleta');                    executed = true; break;
                    case '!rules':              iBot.commands.rulesCommand.functionality(chat, '!rules');                          executed = true; break;
                    case '!sessionstats':       iBot.commands.sessionstatsCommand.functionality(chat, '!sessionstats');            executed = true; break;
                    case '!skip':               iBot.commands.skipCommand.functionality(chat, '!skip');                            executed = true; break;
                    case '!status':             iBot.commands.statusCommand.functionality(chat, '!status');                        executed = true; break;
                    case '!theme':              iBot.commands.themeCommand.functionality(chat, '!theme');                          executed = true; break;
                    case '!timeguard':          iBot.commands.timeguardCommand.functionality(chat, '!timeguard');                  executed = true; break;
                    case '!togglemotd':         iBot.commands.togglemotdCommand.functionality(chat, '!togglemotd');                executed = true; break;
                   case '!clear':         iBot.commands.clearCommand.functionality(chat, '!clear');                executed = true; break;
                    case '!unban':              iBot.commands.unbanCommand.functionality(chat, '!unban');                          executed = true; break;
                    case '!unlock':             iBot.commands.unlockCommand.functionality(chat, '!unlock');                        executed = true; break;
                    case '!unmute':             iBot.commands.unmuteCommand.functionality(chat, '!unmute');                        executed = true; break;
                    case '!usercmdcd':          iBot.commands.usercmdcdCommand.functionality(chat, '!usercmdcd');                  executed = true; break;
                    case '!usercommands':       iBot.commands.usercommandsCommand.functionality(chat, '!usercommands');            executed = true; break;
                    case '!voteratio':          iBot.commands.voteratioCommand.functionality(chat, '!voteratio');                  executed = true; break;
                    case '!welcome':            iBot.commands.welcomeCommand.functionality(chat, '!welcome');                      executed = true; break;
                    case '!website':            iBot.commands.websiteCommand.functionality(chat, '!website');                      executed = true; break;
                    case '!youtube':            iBot.commands.youtubeCommand.functionality(chat, '!youtube');                      executed = true; break;
                    //case '!command': iBot.commands.commandCommand.functionality(chat, '!command'); executed = true; break;
                }
                if(executed && userPerm === 0){
                    iBot.room.usercommand = false;
                    setTimeout(function(){ iBot.room.usercommand = true; }, iBot.roomSettings.commandCooldown * 1000);                               
                }
                if(executed){
                    API.moderateDeleteChat(chat.chatID);
                    iBot.room.allcommand = false;
                    setTimeout(function(){ iBot.room.allcommand = true; }, 5 * 1000);
                }
                return executed;                                
            },                        
            action: function(chat){
                var user = iBot.userUtilities.lookupUser(chat.fromID);                        
                if (chat.type === 'message') {
                    for(var j = 0; j < iBot.room.users.length;j++){
                        if(iBot.userUtilities.getUser(iBot.room.users[j]).id === chat.fromID){
                            iBot.userUtilities.setLastActivity(iBot.room.users[j]);
                        }
                    
                    }
                }
                iBot.room.roomstats.chatmessages++;                                
            },
            spam: [
                'hueh','hu3','brbr','heu','brbr','kkkk','spoder','mafia','zuera','zueira',
                'zueria','aehoo','aheu','alguem','algum','brazil','zoeira','fuckadmins','affff','vaisefoder','huenaarea',
                'hitler','ashua','ahsu','ashau','lulz','huehue','hue','huehuehue','merda','pqp','puta','mulher','pula','retarda','caralho','filha','ppk',
                'gringo','fuder','foder','hua','ahue','modafuka','modafoka','mudafuka','mudafoka','ooooooooooooooo','foda'
            ],
            curses: [
                'nigger', 'faggot', 'nigga', 'niqqa','motherfucker','modafocka'
            ],                        
            beggarSentences: ['fanme','funme','becomemyfan','trocofa','fanforfan','fan4fan','fan4fan','hazcanfanz','fun4fun','fun4fun',
                'meufa','fanz','isnowyourfan','reciprocate','fansme','givefan','fanplz','fanpls','plsfan','plzfan','becomefan','tradefan',
                'fanifan','bemyfan','retribui','gimmefan','fansatfan','fansplz','fanspls','ifansback','fanforfan','addmefan','retribuo',
                'fantome','becomeafan','fan-to-fan','fantofan','canihavefan','pleasefan','addmeinfan','iwantfan','fanplease','ineedfan',
                'ineedafan','iwantafan','bymyfan','fannme','returnfan','bymyfan','givemeafan','sejameufa','sejameusfa','sejameufï¿½ï¿½',
                'sejameusfï¿½ï¿½','fï¿½ï¿½please','fï¿½ï¿½pls','fï¿½ï¿½plz','fanxfan','addmetofan','fanzafan','fanzefan','becomeinfan','backfan',
                'viremmeuseguidor','viremmeuseguir','fanisfan','funforfun','anyfanaccept','anyfanme','fan4fan','fan4fan','turnmyfan',
                'turnifan','beafanofme','comemyfan','plzzfan','plssfan','procurofan','comebackafan','fanyfan','givemefan','fan=fan',
                'fan=fan','fan+fan','fan+fan','fanorfan','beacomeafanofme','beacomemyfan','bcomeafanofme','bcomemyfan','fanstofan',
                'bemefan','trocarfan','fanforme','fansforme','allforfan','fansintofans','fanintofan','f(a)nme','prestomyfan',
                'presstomyfan','fanpleace','fanspleace','givemyafan','addfan','addsmetofan','f4f','canihasfan','canihavefan',
                'givetomeafan','givemyfan','phanme','fanforafan','fanvsfan','fanturniturn','fanturninturn','sejammeufa',
                'sejammeusfa','befanofme','faninfan','addtofan','fanthisaccount','fanmyaccount','fanback','addmeforfan',
                'fans4fan','fans4fan','fanme','fanmyaccount','fanback','addmeforfan','fans4fan','fans4fan','fanme','turnfanwhocontribute',
                "bemefan","bemyfan","beacomeafanofme","beacomemyfan","becameyafan","becomeafan",
                "becomefan","becomeinfan","becomemyfan","becomemyfans","bouncerplease","bouncerpls",
                "brbrbrbr","brbrbrbr","bymyfan","canihasfan","canihavefan","caralho",
                "clickmynametobecomeafan","comebackafan","comemyfan","dosfanos","everyonefan",
                "everyonefans","exchangefan","f4f","f&n","f(a)nme","fnme","ï¿½ï¿½nme","f4f","f4n4f4n",
                "f4nforf4n","f4nme","f4n4f4n","fï¿½ï¿½","fï¿½ï¿½","fï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½please","fï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½pls","fï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½ï¿½plz","fan:four:fan",
                'fanme','funme','becomemyfan','trocofa','fanforfan','fan4fan','fan4fan','hazcanfanz',
                'fun4fun','fun4fun','meufa','fanz','isnowyourfan','reciprocate','fansme','givefan',
                'fanplz','fanpls','plsfan','plzfan','becomefan','tradefan','fanifan','bemyfan',
                'retribui','gimmefan','fansatfan','fansplz','fanspls','ifansback','fanforfan',
                'addmefan','retribuo','fantome','becomeafan','fan-to-fan','fantofan',
                'canihavefan','pleasefan','addmeinfan','iwantfan','fanplease','ineedfan',
                'ineedafan','iwantafan','bymyfan','fannme','returnfan','bymyfan','givemeafan',
                'sejameufa','sejameusfa','sejameufÃ£','sejameusfÃ£','fÃ£please','fÃ£pls','fÃ£plz',
                'fanxfan','addmetofan','fanzafan','fanzefan','becomeinfan','backfan',
                'viremmeuseguidor','viremmeuseguir','fanisfan','funforfun','anyfanaccept',
                'anyfanme','fan4fan','fan4fan','turnmyfan','turnifan','beafanofme','comemyfan',
                'plzzfan','plssfan','procurofan','comebackafan','fanyfan','givemefan','fan=fan',
                'fan=fan','fan+fan','fan+fan','fanorfan','beacomeafanofme','beacomemyfan',
                'bcomeafanofme','bcomemyfan','fanstofan','bemefan','trocarfan','fanforme',
                'fansforme','allforfan','fansintofans','fanintofan','f(a)nme','prestomyfan',
                'presstomyfan','fanpleace','fanspleace','givemyafan','addfan','addsmetofan',
                'f4f','canihasfan','canihavefan','givetomeafan','givemyfan','phanme','but i need please fan',
                'fanforafan','fanvsfan','fanturniturn','fanturninturn','sejammeufa',
                'sejammeusfa','befanofme','faninfan','addtofan','fanthisaccount',
                'fanmyaccount','fanback','addmeforfan','fans4fan','fans4fan','fanme','bemyfanpls','befanpls','f4f','fanyfan'
            ],
        },
        connectAPI: function(){
            this.proxy = {
                    eventChat:                                      $.proxy(this.eventChat,                                     this),
                    eventUserskip:                                  $.proxy(this.eventUserskip,                                 this),
                    eventUserjoin:                                  $.proxy(this.eventUserjoin,                                 this),
                    eventUserleave:                                 $.proxy(this.eventUserleave,                                this),
                    eventUserfan:                                   $.proxy(this.eventUserfan,                                  this),
                    eventFriendjoin:                                $.proxy(this.eventFriendjoin,                               this),
                    eventFanjoin:                                   $.proxy(this.eventFanjoin,                                  this),
                    eventVoteupdate:                                $.proxy(this.eventVoteupdate,                               this),
                    eventCurateupdate:                              $.proxy(this.eventCurateupdate,                             this),
                    eventRoomscoreupdate:                           $.proxy(this.eventRoomscoreupdate,                          this),
                    eventDjadvance:                                 $.proxy(this.eventDjadvance,                                this),
                    eventDjupdate:                                  $.proxy(this.eventDjupdate,                                 this),
                    eventWaitlistupdate:                            $.proxy(this.eventWaitlistupdate,                           this),
                    eventVoteskip:                                  $.proxy(this.eventVoteskip,                                 this),
                    eventModskip:                                   $.proxy(this.eventModskip,                                  this),
                    eventChatcommand:                               $.proxy(this.eventChatcommand,                              this),
                    eventHistoryupdate:                             $.proxy(this.eventHistoryupdate,                            this),

            };            
            API.on(API.CHAT,                                        this.proxy.eventChat);
            API.on(API.USER_SKIP,                                   this.proxy.eventUserskip);
            API.on(API.USER_JOIN,                                   this.proxy.eventUserjoin);
            API.on(API.USER_LEAVE,                                  this.proxy.eventUserleave);
            API.on(API.USER_FAN,                                    this.proxy.eventUserfan);
            API.on(API.FRIEND_JOIN,                                 this.proxy.eventFriendjoin);
            API.on(API.FAN_JOIN,                                    this.proxy.eventFanjoin);
            API.on(API.VOTE_UPDATE,                                 this.proxy.eventVoteupdate);
            API.on(API.CURATE_UPDATE,                               this.proxy.eventCurateupdate);
            API.on(API.ROOM_SCORE_UPDATE,                           this.proxy.eventRoomscoreupdate);
            API.on(API.DJ_ADVANCE,                                  this.proxy.eventDjadvance);
            API.on(API.DJ_UPDATE,                                   this.proxy.eventDjupdate);
            API.on(API.WAIT_LIST_UPDATE,                            this.proxy.eventWaitlistupdate);
            API.on(API.VOTE_SKIP,                                   this.proxy.eventVoteskip);
            API.on(API.MOD_SKIP,                                    this.proxy.eventModskip);
            API.on(API.CHAT_COMMAND,                                this.proxy.eventChatcommand);
            API.on(API.HISTORY_UPDATE,                              this.proxy.eventHistoryupdate);
        },
        disconnectAPI:function(){                        
            API.off(API.CHAT,                                        this.proxy.eventChat);
            API.off(API.USER_SKIP,                                   this.proxy.eventUserskip);
            API.off(API.USER_JOIN,                                   this.proxy.eventUserjoin);
            API.off(API.USER_LEAVE,                                  this.proxy.eventUserleave);
            API.off(API.USER_FAN,                                    this.proxy.eventUserfan);
            API.off(API.FRIEND_JOIN,                                 this.proxy.eventFriendjoin);
            API.off(API.FAN_JOIN,                                    this.proxy.eventFanjoin);
            API.off(API.VOTE_UPDATE,                                 this.proxy.eventVoteupdate);
            API.off(API.CURATE_UPDATE,                               this.proxy.eventCurateupdate);
            API.off(API.ROOM_SCORE_UPDATE,                           this.proxy.eventRoomscoreupdate);
            API.off(API.DJ_ADVANCE,                                  this.proxy.eventDjadvance);
            API.off(API.DJ_UPDATE,                                   this.proxy.eventDjupdate);
            API.off(API.WAIT_LIST_UPDATE,                            this.proxy.eventWaitlistupdate);
            API.off(API.VOTE_SKIP,                                   this.proxy.eventVoteskip);
            API.off(API.MOD_SKIP,                                    this.proxy.eventModskip);
            API.off(API.CHAT_COMMAND,                                this.proxy.eventChatcommand);
            API.off(API.HISTORY_UPDATE,                              this.proxy.eventHistoryupdate);
        },
        startup: function(){
            var u = API.getUser();
            if(u.permission < 2) return API.chatLog("Apenas os admins podem executar o bot.");
            this.connectAPI();
            retrieveFromStorage();
            if(iBot.room.roomstats.launchTime === null){
                iBot.room.roomstats.launchTime = Date.now();
            }
            for(var j = 0; j < iBot.room.users.length; j++){
                iBot.room.users[j].inRoom = false;
            }                        
            var userlist = API.getUsers();
            for(var i = 0; i < userlist.length;i++){
                var known = false;
                var ind = null;
                for(var j = 0; j < iBot.room.users.length; j++){
                    if(iBot.room.users[j].id === userlist[i].id){
                        known = true;
                        ind = j;
                    }
                }
                if(known){
                        iBot.room.users[ind].inRoom = true;
                }
                else{
                        iBot.room.users.push(new iBot.User(userlist[i].id, userlist[i].username));
                        ind = iBot.room.users.length - 1;
                }
                var wlIndex = API.getWaitListPosition(iBot.room.users[ind].id) + 1;
                iBot.userUtilities.updatePosition(iBot.room.users[ind], wlIndex);
            }
            iBot.room.afkInterval = setInterval(function(){iBot.roomUtilities.afkCheck()}, 10 * 1000);
            iBot.room.autodisableInterval = setInterval(function(){iBot.room.autodisableFunc();}, 60 * 60 * 1000);
            iBot.loggedInID = API.getUser().id;            
            iBot.status = true;
            API.sendChat('/meiBot está online!, use a opção !comandos para ver os comandos do bot. :warning:');
        },                        
        commands: {        
            executable: function(minRank, chat){
                var id = chat.fromID;
                var perm = iBot.userUtilities.getPermission(id);
                var minPerm;
                switch(minRank){
                        case 'admin': minPerm = 7; break;
                        case 'ambassador': minPerm = 6; break;
                        case 'host': minPerm = 5; break;
                        case 'cohost': minPerm = 4; break;
                        case 'manager': minPerm = 3; break;
                        case 'mod': 
                                if(iBot.roomSettings.bouncerPlus){
                                    minPerm = 2;
                                }
                                else {
                                    minPerm = 3;
                                }
                                break;
                        case 'bouncer': minPerm = 2; break;
                        case 'residentdj': minPerm = 1; break;
                        case 'user': minPerm = 0; break;
                        default: API.chatLog('error assigning minimum permission');
                };
                if(perm >= minPerm){
                return true;
                }
                else return false;                      
            },                
                /**
                commandCommand: {
                        rank: 'user/bouncer/mod/manager',
                        type: 'startsWith/exact',
                        functionality: function(chat, cmd){
                                if(this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                                if( !iBot.commands.executable(this.rank, chat) ) return void (0);
                                else{
                                
                                };                              
                        },
                },          
                **/

                activeCommand: {
                        rank: 'bouncer',
                        type: 'startsWith',
                        functionality: function(chat, cmd){
                                if(this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                                if( !iBot.commands.executable(this.rank, chat) ) return void (0);
                                else{
                                    var msg = chat.message;
                                    var now = Date.now();
                                    var chatters = 0;
                                    var time;
                                    if(msg.length === cmd.length) time = 60;
                                    else{
                                        time = msg.substring(cmd.length + 1);
                                        if(isNaN(time)) return API.sendChat('/me [' + chat.from + '] Tempo especificado invalido.');
                                    }
                                    for(var i = 0; i < iBot.room.users.length; i++){
                                        userTime = iBot.userUtilities.getLastActivity(iBot.room.users[i]);
                                        if((now - userTime) <= (time * 60 * 1000)){
                                        chatters++;
                                        }
                                    }
                                    API.sendChat('/me [' + chat.from + '] Houve ' + chatters + ' usuários conversando no passado por ' + time + ' minutos.');
                                };                              
                        },
                },

                addCommand: {
                        rank: 'mod',
                        type: 'startsWith',
                        functionality: function(chat, cmd){
                                if(this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                                if( !iBot.commands.executable(this.rank, chat) ) return void (0);
                                else{
                                    var msg = chat.message;
                                    if(msg.length === cmd.length) return API.sendChat('/me [' + chat.from + '] Nenhum usuário especificado.');
                                    var name = msg.substr(cmd.length + 2);   
                                    var user = iBot.userUtilities.lookupUserName(name);
                                    if (msg.length > cmd.length + 2) {
                                        if (typeof user !== 'undefined') {
                                            if(iBot.room.roomevent){
                                                iBot.room.eventArtists.push(user.id);
                                            }
                                            iBot.userUtilities.moveUser(user.id, 0, false);
                                        } else API.sendChat('/me [' + chat.from + '] Usuário invalido especificado.');
                                      }
                                };                              
                        },
                },

                afklimitCommand: {
                        rank: 'manager',
                        type: 'startsWith',
                        functionality: function(chat, cmd){
                                if(this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                                if( !iBot.commands.executable(this.rank, chat) ) return void (0);
                                else{
                                    var msg = chat.message;
                                    if(msg.length === cmd.length) return API.sendChat('/me [' + chat.from + '] Sem limite especificado');
                                    var limit = msg.substring(cmd.length + 1);
                                    if(!isNaN(limit)){
                                        iBot.roomSettings.maximumAfk = parseInt(limit, 10);
                                        API.sendChat('/me [' + chat.from + '] Tempo máximo de AFK mudado para ' + iBot.roomSettings.maximumAfk + ' minutos.');
                                    }
                                    else API.sendChat('/me [' + chat.from + '] Tempo invalido.');
                                };                              
                        },
                },

                afkremovalCommand: {
                        rank: 'bouncer',
                        type: 'exact',
                        functionality: function(chat, cmd){
                                if(this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                                if( !iBot.commands.executable(this.rank, chat) ) return void (0);
                                else{
                                    if(iBot.roomSettings.afkRemoval){
                                        iBot.roomSettings.afkRemoval = !iBot.roomSettings.afkRemoval;
                                        clearInterval(iBot.room.afkInterval);
                                        API.sendChat('/me [' + chat.from + '] Remoção de afks Desligado. :warning:');
                                      }
                                    else {
                                        iBot.roomSettings.afkRemoval = !iBot.roomSettings.afkRemoval;
                                        iBot.room.afkInterval = setInterval(function(){iBot.roomUtilities.afkCheck()}, 2 * 1000);
                                        API.sendChat('/me [' + chat.from + '] Remoção de afks ligado. :warning:');
                                      }
                                };                              
                        },
                },

                afkresetCommand: {
                        rank: 'bouncer',
                        type: 'startsWith',
                        functionality: function(chat, cmd){
                                if(this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                                if( !iBot.commands.executable(this.rank, chat) ) return void (0);
                                else{
                                    var msg = chat.message;
                                    if(msg.length === cmd.length) return API.sendChat('/me [' + chat.from + '] Nenhum usuário especificado.')
                                    var name = msg.substring(cmd.length + 2);
                                    var user = iBot.userUtilities.lookupUserName(name);
                                    if(typeof user === 'boolean') return API.sendChat('/me [' + chat.from + '] Usuário invalido especificado.');
                                    iBot.userUtilities.setLastActivity(user);
                                    API.sendChat('/me [' + chat.from + '] Redefinir o status de afk para ' + name + '.');
                                };                              
                        },
                },

                afktimeCommand: {
                        rank: 'bouncer',
                        type: 'startsWith',
                        functionality: function(chat, cmd){
                                if(this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                                if( !iBot.commands.executable(this.rank, chat) ) return void (0);
                                else{                                    
                                    var msg = chat.message;
                                    if(msg.length === cmd.length) return API.sendChat('/me [' + chat.from + '] Nenhum usuário especificado.');
                                    var name = msg.substring(cmd.length + 2);
                                    var user = iBot.userUtilities.lookupUserName(name);
                                    if(typeof user === 'boolean') return API.sendChat('/me [' + chat.from + '] Usuário invalido.');
                                    var lastActive = iBot.userUtilities.getLastActivity(user);
                                    var inactivity = Date.now() - lastActive;
                                    var time = iBot.roomUtilities.msToStr(inactivity);
                                    API.sendChat('/me [' + chat.from + '] ' + name + ' ficou inativo por ' + time + '.');
                                };                              
                        },
                },
                
                autoskipCommand: {
                        rank: 'mod',
                        type: 'exact',
                        functionality: function(chat, cmd){
                                if(this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                                if( !iBot.commands.executable(this.rank, chat) ) return void (0);
                                else{
                                    if(iBot.roomSettings.autoskip){
                                        iBot.roomSettings.autoskip = !iBot.roomSettings.autoskip;
                                        clearTimeout(iBot.room.autoskipTimer);
                                        return API.sendChat('/me [' + chat.from + '] Autoskip desativado');
                                    }
                                    else{
                                        iBot.roomSettings.autoskip = !iBot.roomSettings.autoskip;
                                        return API.sendChat('/me [' + chat.from + '] Autoskip ativado.');
                                    }
                                };                              
                        },
                },

                autowootCommand: {
                        rank: 'user',
                        type: 'exact',
                        functionality: function(chat, cmd){
                                if(this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                                if( !iBot.commands.executable(this.rank, chat) ) return void (0);
                                else{
                                    API.sendChat("/me Recomendamos esse autowoot : http://plugcubed.net/")
                                };                              
                        },
                },

               pontosCommand: {
                        rank: 'user',
                        type: 'exact',
                        functionality: function(chat, cmd){
                                if(this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                                if( !iBot.commands.executable(this.rank, chat) ) return void (0);
                                else{
                                    API.sendChat("" + chat.from +" :+1: "+ API.getUser(chat.fromID).listenerPoints +" | :sound: "+ API.getUser(chat.fromID).djPoints +" | :star: "+ API.getUser(chat.fromID).curatorPoints +".");
                                };                              
                        },
                },


                baCommand: {
                        rank: 'user',
                        type: 'exact',
                        functionality: function(chat, cmd){
                                if(this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                                if( !iBot.commands.executable(this.rank, chat) ) return void (0);
                                else{
                                    API.sendChat("/me Embaixadores(BA) promovem eventos, envolver a comunidade e compartilhar a mensagem plug.dj todo o mundo. Para mais informações: http://blog.plug.dj/brand-ambassadors/");
                                };                              
                        },
                },

                banCommand: {
                        rank: 'bouncer',
                        type: 'startsWith',
                        functionality: function(chat, cmd){
                                if(this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                                if( !iBot.commands.executable(this.rank, chat) ) return void (0);
                                else{
                                    var msg = chat.message;
                                    if(msg.length === cmd.length) return API.sendChat('/me [' + chat.from + '] Nenhum usuário valido especificado.');
                                    var name = msg.substr(cmd.length + 2);
                                    var user = iBot.userUtilities.lookupUserName(name);
                                    if(typeof user === 'boolean') return API.sendChat('/me [' + chat.from + '] Usuário invalido especificado.');
                                    //API.sendChat('/me [' + chat.from + ' whips out the banhammer :hammer:]');
                                    API.moderateBanUser(user.id, 1, API.BAN.DAY);
                                };                              
                        },
                },

                bouncerPlusCommand: {
                        rank: 'mod',
                        type: 'exact',
                        functionality: function(chat, cmd){
                                if(this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                                if( !iBot.commands.executable(this.rank, chat) ) return void (0);
                                else{
                                    var msg = chat.message;
                                    if(iBot.roomSettings.bouncerPlus){
                                        iBot.roomSettings.bouncerPlus = false;
                                        return API.sendChat('/me [' + chat.from + '] Bouncer+ desligado.');
                                        }
                                    else{ 
                                        if(!iBot.roomSettings.bouncerPlus){
                                            var id = chat.fromID;
                                            var perm = iBot.userUtilities.getPermission(id);
                                            if(perm > 2){
                                                iBot.roomSettings.bouncerPlus = true;
                                                return API.sendChat('/me [' + chat.from + '] Bouncer+ ativado.');
                                            }
                                        }
                                        else return API.sendChat('/me [' + chat.from + '] Você tem que ser menager ou mais para permitir Bouncer +.');
                                    };
                                };                              
                        },
                },

                clearchatCommand: {
                        rank: 'manager',
                        type: 'exact',
                        functionality: function(chat, cmd){
                                if(this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                                if( !iBot.commands.executable(this.rank, chat) ) return void (0);
                                else{
                                    var currentchat = $('#chat-messages').children();       
                                    for (var i = 0; i < currentchat.length; i++) {
                                        for (var j = 0; j < currentchat[i].classList.length; j++) {
                                            if (currentchat[i].classList[j].indexOf('cid-') == 0) 
                                                API.moderateDeleteChat(currentchat[i].classList[j].substr(4));
                                        }
                                    }                                 
                                return API.sendChat('/me [' + chat.from + '] Limpou o Chat.');
                                
                                };                              
                        },
                },

                commandsCommand: {
                        rank: 'user',
                        type: 'exact',
                        functionality: function(chat, cmd){
                                if(this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                                if( !iBot.commands.executable(this.rank, chat) ) return void (0);
                                else{
                                    API.sendChat("/me [" + chat.from + "] Clique no link para ver os comandos do bot:" + iBot.cmdLink);
                                };                              
                        },
                },

                cookieCommand: {
                        rank: 'user',
                        type: 'startsWith',

                        cookies: ['deu-lhe um biscoito de chocolate!',
                                   'deu-lhe um biscoito de aveia caseiro macio!',
                                   'deu-lhe um biscoito velho . Ele foi o último do pacote.',
                                   'deu-lhe um bolinho de assucar.',
                                   'deu-lhe um biscoito de chocolate. Oh, espere, essas são passas',
                                   'deu-lhe um grande biscoito.',
                                   'deu-lhe um biscoito da sorte. leia "Por que você não esta trabalhando em algum projeto?"',
                                   'deu-lhe um biscoito da sorte. leia "De aquela pessoa especial um elogio"',
                                   'deu-lhe um biscoito da sorte. leia "Tome um risco!"',
                                   'deu-lhe um biscoito da sorte. leia "Vá para fora."',
                                   'deu-lhe um biscoito da sorte. leia "Não se esqueça de comer seus legumes!"',
                                   'deu-lhe um biscoito da sorte. leia "Você levanta mesmo?"',
                                   'deu-lhe um biscoito da sorte. leia "Oie kk"',
                                   'deu-lhe um biscoito da sorte. leia "Se você rebolar, você vai ter todas as gatinhas."',
                                   'deu-lhe um biscoito da sorte. leia "Eu te amo."',
                                   'deu-lhe um biscoito de Ouro. Você não pode comer, porque ele é feito de ouro. Droga.',
                                   'deu-lhe um biscoito com um copo de leite!',
                                   'deu-lhe um biscoito arco-íris feito com amor :heart:',
                                   'deu-lhe um biscoito feito pela dlc da Kerou, Aproveite!',
                                   'deu-lhe um biscoito velho que foi deixado de fora na chuva.',
                                   'hmmm, que cheirinho bom ^^'
                            ],

                        getCookie: function() {
                            var c = Math.floor(Math.random() * this.cookies.length);
                            return this.cookies[c];
                        },

                        functionality: function(chat, cmd){
                                if(this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                                if( !iBot.commands.executable(this.rank, chat) ) return void (0);
                                else{
                                    var msg = chat.message;
      
                                    var space = msg.indexOf(' ');
                                    if(space === -1){ 
                                        API.sendChat('/em Coma alguns biscoitos.');
                                        return false;
                                    }
                                    else{
                                        var name = msg.substring(space + 2);
                                        var user = iBot.userUtilities.lookupUserName(name);
                                        if (user === false || !user.inRoom) {
                                          return API.sendChat("/em não vá '" + name + "'  come um biscoito.");
                                        } 
                                        else if(user.username === chat.from){
                                            return API.sendChat("/me " + name +  ", Você esta um pouco ganancioso, não é? Dando biscoitos para si mesmo, bah. Compartilhe alguns com outras pessoas!")
                                        }
                                        else {
                                            return API.sendChat("/me [" + user.username + "], " + chat.from + ' ' + this.getCookie() );
                                        }
                                    }
                                
                                };                              
                        },
                },

                cycleCommand: {
                        rank: 'manager',
                        type: 'exact',
                        functionality: function(chat, cmd){
                                if(this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                                if( !iBot.commands.executable(this.rank, chat) ) return void (0);
                                else{
                                    iBot.roomUtilities.changeDJCycle();
                                };                              
                        },
                },

                cycleguardCommand: {
                        rank: 'bouncer',
                        type: 'exact',
                        functionality: function(chat, cmd){
                                if(this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                                if( !iBot.commands.executable(this.rank, chat) ) return void (0);
                                else{
                                    if(iBot.roomSettings.cycleGuard){
                                        iBot.roomSettings.cycleGuard = !iBot.roomSettings.cycleGuard;
                                        return API.sendChat('/me [' + chat.from + '] Cycleguard desativado.');
                                    }
                                    else{
                                        iBot.roomSettings.cycleGuard = !iBot.roomSettings.cycleGuard;
                                        return API.sendChat('/me [' + chat.from + '] Cycleguard ativado.');
                                    }
                                
                                };                              
                        },
                },

                cycletimerCommand: {
                        rank: 'manager',
                        type: 'startsWith',
                        functionality: function(chat, cmd){
                                if(this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                                if( !iBot.commands.executable(this.rank, chat) ) return void (0);
                                else{
                                    var msg = chat.message;
                                    var cycleTime = msg.substring(cmd.length + 1);
                                    if(!isNaN(cycleTime)){
                                        iBot.roomSettings.maximumCycletime = cycleTime;
                                        return API.sendChat('/me [' + chat.from + '] O cycleguard foi mudado para ' + iBot.roomSettings.maximumCycletime + ' minuto(s).');
                                    }
                                    else return API.sendChat('/me [' + chat.from + '] Sem tempo correto especificado para o CycleGuard.');
                                
                                };                              
                        },
                },

                dclookupCommand: {
                        rank: 'user',
                        type: 'startsWith',
                        functionality: function(chat, cmd){
                                if(this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                                if( !iBot.commands.executable(this.rank, chat) ) return void (0);
                                else{
                                    var msg = chat.message;
                                    var name;
                                    if(msg.length === cmd.length) name = chat.from;
                                    else{ 
                                        name = msg.substring(cmd.length + 2);
                                        var perm = iBot.userUtilities.getPermission(chat.fromID);
                                        if(perm < 2) return API.sendChat('/me [' + chat.from + '] Apenas seguranças e superiores podem fazer !dclookup para os outros.');
                                    }    
                                    var user = iBot.userUtilities.lookupUserName(name);
                                    if(typeof user === 'boolean') return API.sendChat('/me [' + chat.from + '] Usuário invalido .');
                                    var id = user.id;
                                    var toChat = iBot.userUtilities.dclookup(id);
                                    API.sendChat(toChat);
                                };                              
                        },
                },

                emojiCommand: {
                        rank: 'user',
                        type: 'exact',
                        functionality: function(chat, cmd){
                                if(this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                                if( !iBot.commands.executable(this.rank, chat) ) return void (0);
                                else{
                                    API.sendChat('/me Lista de emoticons: http://www.emoji-cheat-sheet.com/');
                                };                              
                        },
                },

                englishCommand: {
                        rank: 'bouncer',
                        type: 'startsWith',
                        functionality: function(chat, cmd){
                                if(this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                                if( !iBot.commands.executable(this.rank, chat) ) return void (0);
                                else{
                                    if(chat.message.length === cmd.length) return API.sendChat('/me Usuário invalido.');
                                    var name = chat.message.substring(cmd.length + 2);
                                    var user = iBot.userUtilities.lookupUserName(name);
                                    if(typeof user === 'boolean') return API.sendChat('/me Usuário não especificado.');
                                    var lang = iBot.userUtilities.getUser(user).language;
                                    var ch = '/me ' + name + ' ';
                                    switch(lang){
                                        case 'en': break;
                                        case 'da': ch += 'Por favor, fale portugues.'; break;
                                        case 'de': ch += 'Por favor, fale portugues.'; break;
                                        case 'es': ch += 'Por favor, fale portugues.'; break;
                                        case 'fr': ch += 'Por favor, fale portugues.'; break;
                                        case 'nl': ch += 'Por favor, fale portugues.'; break;
                                        case 'pl': ch += 'Por favor, fale portugues.'; break;
                                        case 'pt': ch += 'Por favor, fale portugues.'; break;
                                        case 'sk': ch += 'Por favor, fale portugues.'; break;
                                        case 'cs': ch += 'Por favor, fale portugues.'; break;
                                        case 'sr': ch += 'Por favor, fale portugues.'; break;                                  
                                    }
                                    ch += ' Portugues por favor.';
                                    API.sendChat(ch);
                                };                              
                        },
                },

                etaCommand: {
                        rank: 'user',
                        type: 'startsWith',
                        functionality: function(chat, cmd){
                                if(this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                                if( !iBot.commands.executable(this.rank, chat) ) return void (0);
                                else{
                                    var perm = iBot.userUtilities.getPermission(chat.fromID);
                                    var msg = chat.message;
                                    var name;
                                    if(msg.length > cmd.length){
                                        if(perm < 2) return void (0);
                                        name = msg.substring(cmd.length + 2);
                                      } else name = chat.from;
                                    var user = iBot.userUtilities.lookupUserName(name);
                                    if(typeof user === 'boolean') return API.sendChat('/me [' + chat.from + '] Usuário incorreto.');
                                    var pos = API.getWaitListPosition(user.id);
                                    if(pos < 0) return API.sendChat('/me @' + name + ', Deve estar na lista para poder usar o ETA.');
                                    var timeRemaining = API.getTimeRemaining();
                                    var estimateMS = ((pos+1) * 4 * 50 + timeRemaining) * 1000;
                                    var estimateString = iBot.roomUtilities.msToStr(estimateMS);
                                    API.sendChat('/me [' + name + '] Você será o dj em aproximadamente ' + estimateString + '.');                       
                                };                              
                        },
                },

                fbCommand: {
                        rank: 'user',
                        type: 'exact',
                        functionality: function(chat, cmd){
                                if(this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                                if( !iBot.commands.executable(this.rank, chat) ) return void (0);
                                else{
                                    if(typeof iBot.roomSettings.fbLink === "string")
                                        API.sendChat('/me [' + chat.from + '] Entre no nosso grupo do facebook: ' + iBot.roomSettings.fbLink);
                                };                              
                        },
                },

                filterCommand: {
                        rank: 'bouncer',
                        type: 'exact',
                        functionality: function(chat, cmd){
                                if(this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                                if( !iBot.commands.executable(this.rank, chat) ) return void (0);
                                else{
                                    if(iBot.roomSettings.filterChat){
                                        iBot.roomSettings.filterChat = !iBot.roomSettings.filterChat;
                                        return API.sendChat('/me [' + chat.from + '] Chatfilter desativado :warning:');
                                    }
                                    else{
                                        iBot.roomSettings.filterChat = !iBot.roomSettings.filterChat;
                                        return API.sendChat('/me [' + chat.from + '] Chatfilter ativado. :warning:');
                                    } 
                                
                                };                              
                        },
                },

                joinCommand: {
                        rank: 'user',
                        type: 'exact',
                        functionality: function(chat, cmd){
                                if(this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                                if( !iBot.commands.executable(this.rank, chat) ) return void (0);
                                else{
                                    if(iBot.room.roulette.rouletteStatus){
                                        iBot.room.roulette.participants.push(chat.fromID);
                                       API.chatLog('['+ chat.from + '] Entrou na roleta, ID do usuário :[' + chat.fromID + ']')
                                    }
                                };                              
                        },
                },

                jointimeCommand: {
                        rank: 'bouncer',
                        type: 'startsWith',
                        functionality: function(chat, cmd){
                                if(this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                                if( !iBot.commands.executable(this.rank, chat) ) return void (0);
                                else{
                                    var msg = chat.message;
                                    if(msg.length === cmd.length) return API.sendChat('/me [' + chat.from + '] Usuário incorreto.');
                                    var name = msg.substring(cmd.length + 2);
                                    var user = iBot.userUtilities.lookupUserName(name);
                                    if(typeof user === 'boolean') return API.sendChat('/me [' + chat.from + '] Usuário incorreto.');
                                    var join = iBot.userUtilities.getJointime(user);
                                    var time = Date.now() - join;
                                    var timeString = iBot.roomUtilities.msToStr(time);
                                    API.sendChat('/me [' + chat.from + '] ' + name + ' entrou na sala a' + timeString + '.');
                                };                              
                        },
                },

                kickCommand: {
                        rank: 'bouncer',
                        type: 'startsWith',
                        functionality: function(chat, cmd){
                                if(this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                                if( !iBot.commands.executable(this.rank, chat) ) return void (0);
                                else{
                                    var msg = chat.message;
                                    var lastSpace = msg.lastIndexOf(' ');
                                    var time;
                                    var name;
                                    if(lastSpace === msg.indexOf(' ')){
                                        time = 0.25;
                                        name = msg.substring(cmd.length + 2);
                                        }    
                                    else{
                                        time = msg.substring(lastSpace + 1);
                                        name = msg.substring(cmd.length + 2, lastSpace);
                                    }
                                    
                                    var user = iBot.userUtilities.lookupUserName(name);
                                    var from = chat.from;
                                    if(typeof user === 'boolean') return API.sendChat('/me [' + chat.from + '] Usuário não especificado.');

                                    var permFrom = iBot.userUtilities.getPermission(chat.fromID);
                                    var permTokick = iBot.userUtilities.getPermission(user.id);

                                    if(permFrom <= permTokick)
                                        return API.sendChat("/me [" + chat.from + "] Você não pode chutar os usuários com uma classificação igual ou maior do que você!")

                                    if(!isNaN(time)){
                                        API.sendChat('/me [' + name + '], você esta sendo expulso da comunidade por ' + time + ' minutos.');

                                        if(time > 24*60*60) API.moderateBanUser(user.id, 1 , API.BAN.PERMA);
                                            else API.moderateBanUser(user.id, 1, API.BAN.DAY);
                                        setTimeout(function(id, name){ 
                                            API.moderateUnbanUser(id); 
                                            console.log('Unbanned ' + name + '.'); 
                                            }, time * 60 * 1000, user.id, name);
                                        
                                    }

                                    else API.sendChat('/me [' + chat.from + '] Sem tempo valido (minutos) especificado.');                                   
                                };                              
                        },
                },

                killCommand: {
                        rank: 'cohost',
                        type: 'exact',
                        functionality: function(chat, cmd){
                                if(this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                                if( !iBot.commands.executable(this.rank, chat) ) return void (0);
                                else{
                                    storeToStorage();
                                    API.sendChat('/meiBot agora está offline, até mais :)');
                                    API.chatLog('['+ chat.from + '] Desligou o bot, ID do usuário :[' + chat.fromID + ']')
                                    iBot.disconnectAPI();
                                    setTimeout(function(){kill();},1000);
                                };                              
                        },
                },

                leaveCommand: {
                        rank: 'user',
                        type: 'exact',
                        functionality: function(chat, cmd){
                                if(this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                                if( !iBot.commands.executable(this.rank, chat) ) return void (0);
                                else{
                                    var ind = iBot.room.roulette.participants.indexOf(chat.fromID);
                                    if(ind > -1){
                                        iBot.room.roulette.participants.splice(ind, 1);
                                        API.sendChat("/me [" + chat.from + "] saiu da roleta!");
                                    }
                                };                              
                        },
                },

                linkCommand: {
                        rank: 'user',
                        type: 'exact',
                        functionality: function(chat, cmd){
                                if(this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                                if( !iBot.commands.executable(this.rank, chat) ) return void (0);
                                else{
                                    var media = API.getMedia();
                                    var from = chat.from;
                                    var user = iBot.userUtilities.lookupUser(chat.fromID);
                                    var perm = iBot.userUtilities.getPermission(chat.fromID);
                                    var dj = API.getDJ().id;
                                    var isDj = false;
                                    if (dj === chat.fromID) isDj = true;
                                    if(perm >= 1 || isDj){
                                        if(media.format === '1'){
                                            var linkToSong = "https://www.youtube.com/watch?v=" + media.cid;
                                            API.sendChat('/me [' + from + '] Link para a musica atual: ' + linkToSong);
                                        }
                                        if(media.format === '2'){
                                            var SCsource = '/tracks/' + media.cid;
                                            SC.get('/tracks/' + media.cid, function(sound){API.sendChat('/me [' + from + '] Link para a musica atual: ' + sound.permalink_url);});
                                        }   
                                    }                    
                                
                                
                                };                              
                        },
                },

                lockCommand: {
                        rank: 'mod',
                        type: 'exact',
                        functionality: function(chat, cmd){
                                if(this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                                if( !iBot.commands.executable(this.rank, chat) ) return void (0);
                                else{
                                    iBot.roomUtilities.booth.lockBooth();
                                };                              
                        },
                },

                lockdownCommand: {
                        rank: 'mod',
                        type: 'exact',
                        functionality: function(chat, cmd){
                                if(this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                                if( !iBot.commands.executable(this.rank, chat) ) return void (0);
                                else{
                                    var temp = iBot.roomSettings.lockdownEnabled;
                                    iBot.roomSettings.lockdownEnabled = !temp;
                                    if(iBot.roomSettings.lockdownEnabled){
                                        return API.sendChat("/me [" + chat.from + "] Lockdown habilitado. Só o pessoal pode conversar agora.");
                                    }
                                    else return API.sendChat('/me [' + chat.from + '] Lockdown desativado.');
                                
                                };                              
                        },
                },

                lockguardCommand: {
                        rank: 'bouncer',
                        type: 'exact',
                        functionality: function(chat, cmd){
                                if(this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                                if( !iBot.commands.executable(this.rank, chat) ) return void (0);
                                else{
                                    if(iBot.roomSettings.lockGuard){
                                        iBot.roomSettings.lockGuard = !iBot.roomSettings.lockGuard;
                                        return API.sendChat('/me [' + chat.from + '] Lockguard desativado.');
                                    }
                                    else{
                                        iBot.roomSettings.lockGuard = !iBot.roomSettings.lockGuard;
                                        return API.sendChat('/me [' + chat.from + '] Lockguard ativado.');
                                    } 
                                
                                };                              
                        },
                },

                lockskipCommand: {
                        rank: 'bouncer',
                        type: 'startsWith',
                        functionality: function(chat, cmd){
                                if(this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                                if( !iBot.commands.executable(this.rank, chat) ) return void (0);
                                else{
                                    if(iBot.room.skippable){

                                        var dj = API.getDJ();
                                        var id = dj.id;
                                        var name = dj.username;
                                        var msgSend = '' + name + ': ';

                                        iBot.room.queueable = false;

                                        if(chat.message.length === cmd.length){
                                            API.sendChat('/me [' + chat.from + '] usou lockskip.');
                                            iBot.roomUtilities.booth.lockBooth();
                                            //iBot.roomUtilities.changeDJCycle();
                                            setTimeout(function(id){
                                                API.moderateForceSkip();
                                                iBot.room.skippable = false;
                                                setTimeout(function(){ iBot.room.skippable = true}, 5*1000);
                                                setTimeout(function(id){
                                                    iBot.userUtilities.moveUser(id, iBot.roomSettings.lockskipPosition, false);
                                                    iBot.room.queueable = true;
                                                    setTimeout(function(){iBot.roomUtilities.booth.unlockBooth();}, 1000);
                                                    //iBot.roomUtilities.changeDJCycle();
                                                    
                                                },1500, id);
                                            }, 1000, id);

                                            return void (0);

                                        }
                                        var validReason = false;
                                        var msg = chat.message;
                                        var reason = msg.substring(cmd.length + 1);       
                                        for(var i = 0; i < iBot.roomSettings.lockskipReasons.length; i++){
                                            var r = iBot.roomSettings.lockskipReasons[i][0];
                                            if(reason.indexOf(r) !== -1){
                                                validReason = true;
                                                msgSend += iBot.roomSettings.lockskipReasons[i][1];
                                            }
                                        }
                                        if(validReason){
                                            API.sendChat('/me [' + chat.from + ' usou lockskip.]');
                                            iBot.roomUtilities.booth.lockBooth();
                                            //iBot.roomUtilities.changeDJCycle();
                                            setTimeout(function(id){
                                                API.moderateForceSkip();
                                                iBot.room.skippable = false;
                                                API.sendChat(msgSend);
                                                setTimeout(function(){ iBot.room.skippable = true}, 5*1000);
                                                setTimeout(function(id){
                                                    iBot.userUtilities.moveUser(id, iBot.roomSettings.lockskipPosition, false);
                                                    iBot.room.queueable = true;
                                                    setTimeout(function(){iBot.roomUtilities.booth.unlockBooth();}, 1000);
                                                    //iBot.roomUtilities.changeDJCycle();
                                                    
                                                },1500, id);
                                            }, 1000, id);

                                            return void (0);
                                        }
                                                                                
                                    }
                                }                              
                        },
                },

                lockskipposCommand: {
                        rank: 'manager',
                        type: 'startsWith',
                        functionality: function(chat, cmd){
                                if(this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                                if( !iBot.commands.executable(this.rank, chat) ) return void (0);
                                else{
                                    var msg = chat.message;
                                    var pos = msg.substring(cmd.length + 1);
                                    if(!isNaN(pos)){
                                        iBot.roomSettings.lockskipPosition = pos;
                                        return API.sendChat('/me [' + chat.from + '] Lockskip agora vai mover o dj para a posição ' + iBot.roomSettings.lockskipPosition + '.');
                                    }
                                    else return API.sendChat('/me [' + chat.from + '] Posição invalida.');
                                };                              
                        },
                },

                locktimerCommand: {
                        rank: 'manager',
                        type: 'startsWith',
                        functionality: function(chat, cmd){
                                if(this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                                if( !iBot.commands.executable(this.rank, chat) ) return void (0);
                                else{
                                    var msg = chat.message;
                                    var lockTime = msg.substring(cmd.length + 1);
                                    if(!isNaN(lockTime)){
                                        iBot.roomSettings.maximumLocktime = lockTime;
                                        return API.sendChat('/me [' + chat.from + '] O LockGuard esta definido para ' + iBot.roomSettings.maximumLocktime + ' minuto(s).');
                                    }
                                    else return API.sendChat('/me [' + chat.from + '] Sem tempo correto especificado para o LockGuard.');
                                };                              
                        },
                },

                maxlengthCommand: {
                        rank: 'bouncer',
                        type: 'startsWith',
                        functionality: function(chat, cmd){
                                if(this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                                if( !iBot.commands.executable(this.rank, chat) ) return void (0);
                                else{
                                    var msg = chat.message;
                                    var maxTime = msg.substring(cmd.length + 1);
                                    if(!isNaN(maxTime)){
                                        iBot.roomSettings.maximumSongLength = maxTime;
                                        return API.sendChat('/me [' + chat.from + '] A duração máxima para musica esta definido para ' + iBot.roomSettings.maximumSongLength + ' minutos.');
                                    }
                                    else return API.sendChat('/me [' + chat.from + '] Tempo incorreto.');
                                };                              
                        },
                },

                motdCommand: {
                        rank: 'bouncer',
                        type: 'startsWith',
                        functionality: function(chat, cmd){
                                if(this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                                if( !iBot.commands.executable(this.rank, chat) ) return void (0);
                                else{
                                    var msg = chat.message;
                                    if(msg.length <= cmd.length + 1) return API.sendChat('/me MotD: ' + iBot.roomSettings.motd);
                                    var argument = msg.substring(cmd.length + 1);
                                    if(!iBot.roomSettings.motdEnabled) iBot.roomSettings.motdEnabled = !iBot.roomSettings.motdEnabled;
                                    if(isNaN(argument)){
                                        iBot.roomSettings.motd = argument;
                                        API.sendChat("/me MotD setado para: " + iBot.roomSettings.motd);
                                    }
                                    else{
                                        iBot.roomSettings.motdInterval = argument;
                                        API.sendChat('/me MotD intervalo setado para ' + iBot.roomSettings.motdInterval + '.');
                                    }
                                };                              
                        },
                },

                moveCommand: {
                        rank: 'mod',
                        type: 'startsWith',
                        functionality: function(chat, cmd){
                                if(this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                                if( !iBot.commands.executable(this.rank, chat) ) return void (0);
                                else{
                                    var msg = chat.message;
                                    if(msg.length === cmd.length) return API.sendChat('/me [' + chat.from + '] Nenhum usuário especificado.');
                                    var firstSpace = msg.indexOf(' ');
                                    //var secondSpace = msg.substring(firstSpace + 1).indexOf(' ');
                                    var lastSpace = msg.lastIndexOf(' ');
                                    var pos;
                                    var name;
                                    if(isNaN(parseInt(msg.substring(lastSpace + 1))) ){
                                        pos = 1;
                                        name = msg.substring(cmd.length + 2);
                                    }
                                    else{
                                        pos = parseInt(msg.substring(lastSpace + 1));
                                        name = msg.substring(cmd.length + 2,lastSpace);
                                    }
                                    var user = iBot.userUtilities.lookupUserName(name);
                                    if(typeof user === 'boolean') return API.sendChat('/me [' + chat.from + '] Usuário invalido especificado.');
                                    if(user.id === iBot.loggedInID) return API.sendChat('/me [' + chat.from + '] Não tente me adicionar a  lista de espera, por favor.');
                                    if (!isNaN(pos)) {
                                        API.sendChat('/me [' + chat.from + ' usou move.]');
                                        iBot.userUtilities.moveUser(user.id, pos, false); 
                                    } else return API.sendChat('/me [' + chat.from + '] Posição invalida.');
                                };                           
                        },
                },

                muteCommand: {
                        rank: 'bouncer',
                        type: 'startsWith',
                        functionality: function(chat, cmd){
                                if(this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                                if( !iBot.commands.executable(this.rank, chat) ) return void (0);
                                else{
                                    var msg = chat.message;
                                    if(msg.length === cmd.length) return API.sendChat('/me [' + chat.from + '] Nenhum usuário especificado.');
                                    var lastSpace = msg.lastIndexOf(' ');
                                    var time = null;
                                    var name;
                                    if(lastSpace === msg.indexOf(' ')){
                                        name = msg.substring(cmd.length + 2);
                                        }    
                                    else{
                                        time = msg.substring(lastSpace + 1);
                                        if(isNaN(time)){
                                            return API.sendChat('/me [' + chat.from + '] Tempo especificado inválido.');
                                        }
                                        name = msg.substring(cmd.length + 2, lastSpace);
                                    }
                                    var from = chat.from;
                                    var user = iBot.userUtilities.lookupUserName(name);
                                    if(typeof user === 'boolean') return API.sendChat('/me [' + chat.from + '] Nenhum usuário especificado.');
                                    var permFrom = iBot.userUtilities.getPermission(chat.fromID);
                                    var permUser = iBot.userUtilities.getPermission(user.id);
                                    if(permFrom > permUser){
                                        iBot.room.mutedUsers.push(user.id);
                                        if(time === null) API.sendChat('/me [' + chat.from + '] Mutou ' + name + '.');
                                        else{
                                            API.sendChat('/me [' + chat.from + '] Mutou ' + name + ' por ' + time + ' minutos.');
                                            setTimeout(function(id){
                                                var muted = iBot.room.mutedUsers;
                                                var wasMuted = false;
                                                var indexMuted = -1;
                                                for(var i = 0; i < muted.length; i++){
                                                    if(muted[i] === id){
                                                        indexMuted = i;
                                                        wasMuted = true;
                                                    }
                                                }
                                                if(indexMuted > -1){
                                                    iBot.room.mutedUsers.splice(indexMuted);
                                                    var u = iBot.userUtilities.lookupUser(id);
                                                    var name = u.username;
                                                    API.sendChat('/me [' + chat.from + '] desmutou ' + name + '.');
                                                }
                                            }, time * 60 * 1000, user.id);
                                        } 
                                    }
                                    else API.sendChat("/me [" + chat.from + "] Você não pode silenciar as pessoas com um grau igual ou maior do que você.");
                                };                              
                        },
                },

                opCommand: {
                        rank: 'user',
                        type: 'exact',
                        functionality: function(chat, cmd){
                                if(this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                                if( !iBot.commands.executable(this.rank, chat) ) return void (0);
                                else{
                                    if(typeof iBot.roomSettings.opLink === "string")
                                        return API.sendChat("/me Lista de banidos: " + iBot.roomSettings.opLink);
                                    
                                };                              
                        },
                },

                pingCommand: {
                        rank: 'user',
                        type: 'exact',
                        functionality: function(chat, cmd){
                                if(this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                                if( !iBot.commands.executable(this.rank, chat) ) return void (0);
                                else{
                                    API.sendChat('/me Pong!')
                                };                              
                        },
                },

                refreshCommand: {
                        rank: 'manager',
                        type: 'exact',
                        functionality: function(chat, cmd){
                                if(this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                                if( !iBot.commands.executable(this.rank, chat) ) return void (0);
                                else{
                                    storeToStorage();
                                    iBot.disconnectAPI();
                                    setTimeout(function(){
                                    window.location.reload(false);
                                        },1000);
                                
                                };                              
                        },
                },

                reloadCommand: {
                        rank: 'bouncer',
                        type: 'exact',
                        functionality: function(chat, cmd){
                                if(this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                                if( !iBot.commands.executable(this.rank, chat) ) return void (0);
                                else{
                                    API.sendChat('/me Reiniciando :warning:.');
                                    iBot.disconnectAPI();
                                    setTimeout(function(){$.getScript(iBot.scriptLink);},2000);
                                };                              
                        },
                },

                antiBotCommand: {
                        rank: 'bouncer',
                        type: 'exact',
                        functionality: function(chat, cmd){
                                if(this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                                if( !iBot.commands.executable(this.rank, chat) ) return void (0);
                                else{
                                    API.sendChat('/meAlternando para antiga versão do chatbot, aguarde... :warning:');
                                    iBot.disconnectAPI();
                                    setTimeout(function(){$.getScript(iBot.chatbotLink);},2000);
                                };                              
                        },
                },

                removeCommand: {
                        rank: 'mod',
                        type: 'startsWith',
                        functionality: function(chat, cmd){
                                if(this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                                if( !iBot.commands.executable(this.rank, chat) ) return void (0);
                                else{
                                    var msg = chat.message;
                                    if (msg.length > cmd.length + 2) {
                                        var name = msg.substr(cmd.length + 2);
                                        var user = iBot.userUtilities.lookupUserName(name);
                                        if (typeof user !== 'boolean') {
                                            API.moderateRemoveDJ(user.id);                                          
                                        } else API.sendChat("/me [" + chat.from + "] O usuário especificado " + name + " Não esta na lista de espera.");
                                      } else API.sendChat("/me [" + chat.from + "] Nenhum usuário especificado.");
                                
                                };                              
                        },
                },

                restrictetaCommand: {
                        rank: 'bouncer',
                        type: 'exact',
                        functionality: function(chat, cmd){
                                if(this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                                if( !iBot.commands.executable(this.rank, chat) ) return void (0);
                                else{
                                    if(iBot.roomSettings.etaRestriction){
                                        iBot.roomSettings.etaRestriction = !iBot.roomSettings.etaRestriction;
                                        return API.sendChat('/me [' + chat.from + '] eta unrestrito.');
                                    }
                                    else{
                                        iBot.roomSettings.etaRestriction = !iBot.roomSettings.etaRestriction;
                                        return API.sendChat('/me [' + chat.from + '] eta restrito.');
                                    } 
                                
                                };                              
                        },
                },

                rouletteCommand: {
                        rank: 'mod',
                        type: 'exact',
                        functionality: function(chat, cmd){
                                if(this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                                if( !iBot.commands.executable(this.rank, chat) ) return void (0);
                                else{
                                    if(!iBot.room.roulette.rouletteStatus){
                                        iBot.room.roulette.startRoulette();
                                       API.chatLog('['+ chat.from + '] Iniciou a roleta, ID do usuário :[' + chat.fromID + ']')
                                    }
                                };                              
                        },
                },

                rulesCommand: {
                        rank: 'user',
                        type: 'exact',
                        functionality: function(chat, cmd){
                                if(this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                                if( !iBot.commands.executable(this.rank, chat) ) return void (0);
                                else{
                                    if(typeof iBot.roomSettings.rulesLink === "string")
                                        return API.sendChat("/me Por favor, veja nossas regras: " + iBot.roomSettings.rulesLink);                                
                                };                              
                        },
                },

                sessionstatsCommand: {
                        rank: 'bouncer',
                        type: 'exact',
                        functionality: function(chat, cmd){
                                if(this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                                if( !iBot.commands.executable(this.rank, chat) ) return void (0);
                                else{
                                    var from = chat.from;
                                    var woots = iBot.room.roomstats.totalWoots;
                                    var mehs = iBot.room.roomstats.totalMehs;
                                    var grabs = iBot.room.roomstats.totalCurates;
                                    API.sendChat('/me [' + from + '] Total woots: ' + woots + ', total mehs: ' + mehs + ', total grabs: ' + grabs + '.');
                                };                              
                        },
                },

                skipCommand: {
                        rank: 'bouncer',
                        type: 'exact',
                        functionality: function(chat, cmd){
                                if(this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                                if( !iBot.commands.executable(this.rank, chat) ) return void (0);
                                else{
                                    API.sendChat('/me [' + chat.from + '] Usou !skip.]');
                                    API.moderateForceSkip();
                                    iBot.room.skippable = false;
                                    setTimeout(function(){ iBot.room.skippable = true}, 5*1000);
                                
                                };                              
                        },
                },  

                sourceCommand: {
                        rank: 'user',
                        type: 'exact',
                        functionality: function(chat, cmd){
                                if(this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                                if( !iBot.commands.executable(this.rank, chat) ) return void (0);
                                else{
                                    API.sendChat('/me Este bot foi feito por ' + iBot.creator + '.');
                                };                              
                        },
                },

                statusCommand: {
                        rank: 'bouncer',
                        type: 'exact',
                        functionality: function(chat, cmd){
                                if(this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                                if( !iBot.commands.executable(this.rank, chat) ) return void (0);
                                else{
                                    var from = chat.from
                                    var msg = '/me [' + from + '] ';
                                      
                                    msg += 'AFK remover: ';
                                    if(iBot.roomSettings.afkRemoval) msg += 'ON';
                                    else msg += 'OFF';
                                    msg += '. ';
                                    msg += "AFK's removidos: " + iBot.room.afkList.length + '. ';
                                    msg += 'AFK limite: ' + iBot.roomSettings.maximumAfk + '. ';
                                     
                                    msg+= 'Bouncer+: '
                                    if(iBot.roomSettings.bouncerPlus) msg += 'ON';
                                    else msg += 'OFF';
                                    msg += '. ';

                                    msg+= 'Lockguard: '
                                    if(iBot.roomSettings.lockGuard) msg += 'ON';
                                    else msg += 'OFF';
                                    msg += '. ';

                                    msg+= 'Cycleguard: '
                                    if(iBot.roomSettings.cycleGuard) msg += 'ON';
                                    else msg += 'OFF';
                                    msg += '. ';

                                    msg+= 'Timeguard: '
                                    if(iBot.roomSettings.timeGuard) msg += 'ON';
                                    else msg += 'OFF';
                                    msg += '. ';

                                    msg+= 'Chatfilter: '
                                    if(iBot.roomSettings.filterChat) msg += 'ON';
                                    else msg += 'OFF';
                                    msg += '. ';

                                    var launchT = iBot.room.roomstats.launchTime;
                                    var durationOnline = Date.now() - launchT;
                                    var since = iBot.roomUtilities.msToStr(durationOnline);
                                    msg += 'Tempo ativo  ' + since + '. ';
                                      
                                     return API.sendChat(msg);
                                };                              
                        },
                },

                themeCommand: {
                        rank: 'user',
                        type: 'exact',
                        functionality: function(chat, cmd){
                                if(this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                                if( !iBot.commands.executable(this.rank, chat) ) return void (0);
                                else{
                                    if(typeof iBot.roomSettings.themeLink === "string")
                                        API.sendChat("/me Por favor, veja os temas da sala: " + iBot.roomSettings.themeLink);
                                
                                };                              
                        },
                },

                timeguardCommand: {
                        rank: 'bouncer',
                        type: 'exact',
                        functionality: function(chat, cmd){
                                if(this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                                if( !iBot.commands.executable(this.rank, chat) ) return void (0);
                                else{
                                    if(iBot.roomSettings.timeGuard){
                                        iBot.roomSettings.timeGuard = !iBot.roomSettings.timeGuard;
                                        return API.sendChat('/me [' + chat.from + '] Timeguard desativado.');
                                    }
                                    else{
                                        iBot.roomSettings.timeGuard = !iBot.roomSettings.timeGuard;
                                        return API.sendChat('/me [' + chat.from + '] Timeguard ativado.');
                                    } 
                                
                                };                              
                        },
                },

                togglemotdCommand: {
                        rank: 'bouncer',
                        type: 'exact',
                        functionality: function(chat, cmd){
                                if(this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                                if( !iBot.commands.executable(this.rank, chat) ) return void (0);
                                else{
                                    if(iBot.roomSettings.motdEnabled){
                                        iBot.roomSettings.motdEnabled = !iBot.roomSettings.motdEnabled;
                                        API.sendChat('/me MotD desativado.');
                                    }
                                    else{
                                        iBot.roomSettings.motdEnabled = !iBot.roomSettings.motdEnabled;
                                        API.sendChat('/me MotD ativado.');
                                    }
                                };                              
                        },
                },

                unbanCommand: {
                        rank: 'bouncer',
                        type: 'startsWith',
                        functionality: function(chat, cmd){
                                if(this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                                if( !iBot.commands.executable(this.rank, chat) ) return void (0);
                                else{
                                    var msg = chat.message;
                                    if(msg.length === cmd.length) return API.sendChat()
                                    var name = msg.substring(chat.length + 2);
                                    var bannedUsers = API.getBannedUsers();
                                    var found = false;
                                    for(var i = 0; i < bannedUsers.length; i++){
                                        var user = bannedUsers[i];
                                        if(user.username === name){
                                            id = user.id;
                                            found = true;
                                        }
                                      }
                                      if(!found) return API.sendChat('/me [' + chat.from + '] O usuário não foi banido.');
                                      
                                    API.moderateUnbanUser(user.id);
                                
                                };                              
                        },
                },


                unlockCommand: {
                        rank: 'mod',
                        type: 'exact',
                        functionality: function(chat, cmd){
                                if(this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                                if( !iBot.commands.executable(this.rank, chat) ) return void (0);
                                else{
                                    iBot.roomUtilities.booth.unlockBooth();
                                };                              
                        },
                },

                unmuteCommand: {
                        rank: 'bouncer',
                        type: 'startsWith',
                        functionality: function(chat, cmd){
                                if(this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                                if( !iBot.commands.executable(this.rank, chat) ) return void (0);
                                else{
                                    var msg = chat.message;
                                    var permFrom = iBot.userUtilities.getPermission(chat.fromID);
                                      
                                    if(msg.indexOf('') === -1 && msg.indexOf('all') !== -1){
                                        if(permFrom > 2){
                                            iBot.room.mutedUsers = [];
                                            return API.sendChat('/me [' + chat.from + '] Desmutou todos.');
                                        }
                                        else return API.sendChat('/me [' + chat.from + '] Somente os bouncers ou mais podem desmutar todos de uma vez.')
                                    }
                                      
                                    var from = chat.from;
                                    var name = msg.substr(cmd.length + 2);

                                    var user = iBot.userUtilities.lookupUserName(name);
                                      
                                    if(typeof user === 'boolean') return API.sendChat("/me Usuário invalido especificado.");
                                    
                                    var permUser = iBot.userUtilities.getPermission(user.id);
                                    if(permFrom > permUser){

                                        var muted = iBot.room.mutedUsers;
                                        var wasMuted = false;
                                        var indexMuted = -1;
                                        for(var i = 0; i < muted.length; i++){
                                            if(muted[i] === user.id){
                                                indexMuted = i;
                                                wasMuted = true;
                                            }

                                        }
                                        if(!wasMuted) return API.sendChat("/me [" + chat.from + "]  o usuário não foi silenciado.");
                                        iBot.room.mutedUsers.splice(indexMuted);
                                        API.sendChat('/me [' + chat.from + '] Desmutou o ' + name + '.');
                                    }
                                    else API.sendChat("/me [" + chat.from + "] Você não pode Desmutar pessoas com uma classificação igual ou superior a você.");
                                    
                                };                              
                        },
                },

                usercmdcdCommand: {
                        rank: 'manager',
                        type: 'startsWith',
                        functionality: function(chat, cmd){
                                if(this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                                if( !iBot.commands.executable(this.rank, chat) ) return void (0);
                                else{
                                    var msg = chat.message;
                                    var cd = msg.substring(cmd.length + 1);
                                    if(!isNaN(cd)){
                                        iBot.roomSettings.commandCooldown = cd;
                                        return API.sendChat('/me [' + chat.from + ']O tempo para os comandos dos usuários esta definido para ' + iBot.roomSettings.commandCooldown + ' segundos.');
                                    }
                                    else return API.sendChat('/me [' + chat.from + '] Sem cooldown correto especificado.');
                                
                                };                              
                        },
                },

                usercommandsCommand: {
                        rank: 'manager',
                        type: 'exact',
                        functionality: function(chat, cmd){
                                if(this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                                if( !iBot.commands.executable(this.rank, chat) ) return void (0);
                                else{
                                    if(iBot.roomSettings.usercommandsEnabled){
                                        API.sendChat('/me [' + chat.from + '] Usercommands desativado.');
                                        iBot.roomSettings.usercommandsEnabled = !iBot.roomSettings.usercommandsEnabled;
                                    }
                                    else{
                                        API.sendChat('/me [' + chat.from + '] Usercommands ativado.');
                                        iBot.roomSettings.usercommandsEnabled = !iBot.roomSettings.usercommandsEnabled;
                                    }
                                };                              
                        },
                },

                voteratioCommand: {
                        rank: 'bouncer',
                        type: 'startsWith',
                        functionality: function(chat, cmd){
                                if(this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                                if( !iBot.commands.executable(this.rank, chat) ) return void (0);
                                else{
                                    var msg = chat.message;
                                    if(msg.length === cmd.length) return API.sendChat('[' + chat.from + '] Nenhum usuário especificado.');
                                    var name = msg.substring(cmd.length + 2);
                                    var user = iBot.userUtilities.lookupUserName(name);
                                    if(user === false) return API.sendChat('/me [' + chat.from + '] Usuário invalido especificado.');
                                    var vratio = user.votes;
                                    var ratio = vratio.woot / vratio.meh;
                                    API.sendChat('/me [' + chat.from + '] ' + name + ' ~ woots: ' + vratio.woot + ', mehs: ' + vratio.meh + ', ratio (w/m): ' + ratio.toFixed(2) + '.');
                                };                              
                        },
                },

                welcomeCommand: {
                        rank: 'bouncer',
                        type: 'exact',
                        functionality: function(chat, cmd){
                                if(this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                                if( !iBot.commands.executable(this.rank, chat) ) return void (0);
                                else{
                                    if(iBot.roomSettings.welcome){
                                        iBot.roomSettings.welcome = !iBot.roomSettings.welcome;
                                        return API.sendChat('/me [' + chat.from + '] Mensagem de boas vindas desativada.  :warning:');
                                    }
                                    else{
                                        iBot.roomSettings.welcome = !iBot.roomSettings.welcome;
                                        return API.sendChat('/me [' + chat.from + '] Mensagem de boas vindas ativada.  :warning:');
                                    } 
                                
                                };                              
                        },
                },

                websiteCommand: {
                        rank: 'user',
                        type: 'exact',
                        functionality: function(chat, cmd){
                                if(this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                                if( !iBot.commands.executable(this.rank, chat) ) return void (0);
                                else{
                                    if(typeof iBot.roomSettings.website === "string")
                                        API.sendChat('/me Visite nosso site: ' + iBot.roomSettings.website);
                                };                              
                        },
                },

                youtubeCommand: {
                        rank: 'user',
                        type: 'exact',
                        functionality: function(chat, cmd){
                                if(this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                                if( !iBot.commands.executable(this.rank, chat) ) return void (0);
                                else{
                                    if(typeof iBot.roomSettings.youtubeLink === "string")
                                        API.sendChat('/me[' + chat.from + '] Inscreva-se em nosso canal: http://goo.gl/O38Cmj');                                
                                };                              
                        },
                },
                twitterCommand: {
                        rank: 'user',
                        type: 'exact',
                        functionality: function(chat, cmd){
                                if(this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                                if( !iBot.commands.executable(this.rank, chat) ) return void (0);
                                else{
                                    if(typeof iBot.roomSettings.youtubeLink === "string")
                                        API.sendChat('/me[' + chat.from + '] Siga-nos no twitter : http://goo.gl/9DowgB');                                
                                };                              
                        },
                },
                
        },
                
};

iBot.startup(); 
}).call(this);
