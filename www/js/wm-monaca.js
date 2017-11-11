/* InAppBrowserを開いて、code取得 + Tokenと交換まで*/
function authorizeWithBrowser()
{
    // InAppBrowserで遷移（認証画面オープン）
    // scope を書き込みも設定
    var res = window.open(
        "https://api.toodledo.com/3/account/authorize.php?response_type=code&client_id=WMmonaca&state=fake&scope=basic%20tasks%20write",
        "_blank", 'location=yes' );

    var access_token = null;

    // イベントリスナーで遷移したらcodeの処理をする
    res.addEventListener( "loadstart", function( event )
    {
        console.log( "InAppBrowser LoadStart : " + event.url );

        var url = event.url.split( "?" )[ 0 ];
        console.log( url );
        if ( url.indexOf( "https://work-meister-monaca" ) != -1 )
        {
            // パラメータ文字列の処理
            var params = event.url.split( "?" )[ 1 ].split( "&" );

            for ( var i = 0; i < params.length; i++ )
            {
                // パラメータからcodeをもらう
                if ( params[ i ].split( "=" )[ 0 ] == "code" )
                {
                    var code = params[ i ].split( "=" )[ 1 ];

                    // codeとtokenを交換する
                    access_token = getTokenWithCode( code );
                }
                break;
            }
            res.close(); // InAppBrowser を閉じる
        }
    } );

    return access_token;

}

// ローカルストレージからデータを読み込む
function loadDataLocalStorage( key )
{
    return window.localStorage.getItem( key );
}

// ローカルストレージにデータを保存する
function saveDataLocalStorage( key, value )
{
    return window.localStorage.setItem( key, value );
}

/* Toodledoからタスクを取得する */
function getTasklist()
{
    console.log( "getTasklist" );

    // アクセストークンを準備する
    var access_token = prepareAccessToken();

    var filter = {};
    filter.comp = 0;
    filter.fields =
        "context,folder,startdate,starttime,duedate,duetime,length,tag,parent,children";


    // 通信に成功した場合
    var doneFunc = function( data, textState )
    {
        console.log( "getTasks:done" );

        // タスクリストを一回フラッシュする
        putHeaders();

        for ( var i = 1; i < data.length; i++ )
        {
            // フィルタ（期限が設定されているもの
            if ( data[ i ].duedate == 0 || data[ i ].duedate > UTCToday() ) continue;

            // タスクを並べる　本来はcssで整形すべき？
            // 2行、1行目　タイトル　2行目　時間、フォルダ、期限
            appendTaskToTasklist( data[ i ] ); // タスク行をぶら下げる

        }

        updateNumberOfTasks();
        updateTimeOfTasks();

    };

    // 通信に失敗した場合、リフレッシュトークンでのトークン交換を試みる
    var failFunc = function( jqXHR, textState, errorThrown )
    {
        console.log( "getTasks:fail" );

        // 2回目は実施しないようにする
        if ( bRetry == true )
        {
            bRetry = false;
            ons.notification.toast(
            {
                message: "取得に失敗しました",
                timeout: 1500
            } );
            return;
        }

        // リトライフラグを立てる
        bRetry = true;

        var refresh_token = window.localStorage.getItem( "ToodledoRefreshToken" );
        if ( refresh_token != null )
        {
            refreshToken( refresh_token );
        }
        else
        {
            redirectToodledoAuthorization();
        }

        retrieveTasks( filter, doneFunc, failFunc );

    };

    retrieveTasks( filter, doneFunc, failFunc );

}

//
function appendTaskToTasklist( data )
{
    if ( data.context == undefined )
    {
        data.context = 0;
    }

    // タスクリストにタスク行を加える
    $( "div[context='" + data.context + "']" )
        .after( "<li class='task' task='" + data.id + "'></li>" );

    // タスク情報の付加
    var a = $( ".task[task='" + data.id + "']" );
    a.attr( "title", data.title );
    a.attr( "context", data.context );
    a.attr( "length", data.length );
    a.attr( "folder", data.folder );
    a.attr( "duedate", data.duedate );
    a.attr( "duetime", data.duetime );
    a.attr( "startdate", data.startdate );
    a.attr( "starttime", data.starttime );
    a.attr( "tag", data.tag );
    a.attr( "parent", data.parent );

    a.attr( "children", data.children );

    makeTaskHTML( data.id );

}

// タスクリストの行を作る
function makeTaskHTML( id )
{
    taskObj = getTaskItem( id ); // 対象のタスク要素を選択

    taskObj.append( "<div class='info1'></div>" );
    taskObj.append( "<div class='info2'></div>" );

    /* 子タスク、親タスクの表示付加 */
    var b = taskObj.children( "div.info1" );
    if ( taskObj.attr( "parent" ) == 0 )
    {
        b.append( "<div class='parent'>○</div>" );
    }
    else
    {
        b.append( "<div class='parent'>●</div>" );
    }
    if ( taskObj.attr( "children" ) == 0 )
    {
        b.append( "<div class='children'>□</div>" );
    }
    else
    {
        b.append( "<div class='children'>■</div>" );
    }

    // その他表示
    var c = taskObj.children( "div.info2" );
    c.append( "<div class='title'>" + taskObj.attr( "title" ) + "</div>" );
    c.append( "<div class='length'>" + taskObj.attr( "length" ) + "</div>" );
    c.append( "<div class='folder'>" + folderlist[ taskObj.attr( "folder" ) ] + "</div>" );
    if ( taskObj.attr( "duetime" ) == 0 || taskObj.attr( "duetime" ) == undefined )
    {
        c.append( "<div class='due'>" +
            UTCtoDateString( taskObj.attr( "duedate" ) ) + "</div>" );
    }
    else
    {
        c.append( "<div class='due'>" +
            UTCtoDateString( taskObj.attr( "duetime" ) ) + "</div>" );
    }

    /* タグをチェックし、started状態を確認する */
    var tags;
    var attrTag = taskObj.attr( "tag" ); // タスクのtagを読み出す
    if ( attrTag != null )
    {
        attrTag = attrTag.replace( /\s+/g, "" ); // 空白を削除する        
        tags = attrTag.split( "," ); // カンマで分ける
    }
    else
    {
        tags = [];
    }

    if ( tags.indexOf( "started" ) >= 0 )
    {
        taskObj.attr( "state", "started" );
    }

}


/* Toodledoからタスクを取得する */
function completeTaskMonaca( id )
{
    console.log( "completeTask : start" );

    // 通信に成功した場合
    var donefunc = function( data, textState )
    {
        console.log( "completeTask : done" );

        for ( var i = 0; i < data.length; i++ )
        {
            if ( data[ i ].id != undefined )
            {
                // タスクを消す
                getTaskItem( data[ i ].id )
                    .remove();

                ons.notification.toast(
                {
                    "message": "\"" + data[ i ].title + "\"を完了しました",
                    "timeout": 1500
                } );
            }
            else
            {
                ons.notification.toast(
                {
                    "message": "[完了]該当タスクが見つかりません。",
                    "timeout": 1500
                } );
            }
        }

        // タスク数、残り時間の更新
        updateNumberOfTasks();
        updateTimeOfTasks();

        // タイマーの表示状態をcompleteにする
        $( "#timer" )
            .removeClass( "timeup" ); // 時間超過を消す
        $( "#timer" )
            .addClass( "completed" );

        return true;
    };

    // 通信に失敗した場合、リフレッシュトークンでのトークン交換を試みる
    var failfunc = function( jqXHR, textState, errorThrown )
    {
        console.log( "completeTask:fail" );
        console.log( jqXHR.responseText ); // レスポンスをテキストでログ出力

        ons.notification.toast(
        {
            message: "タスク完了に失敗しました",
            timeout: 1500
        } );
        return false;
    };

    return completeTask( id, donefunc, failfunc );
}

/* タスクの開始処理をしてタイマーを起動させる */
function startTaskMonaca( id )
{
    console.log( "startTask" );
    scrollTo( 0, 100 );
    // 開始時刻を設定する
    // -starttimeに開始時間を設定する

    // タスク情報
    var taskinfo = {};
    taskinfo.id = id;
    taskinfo.startdate = UTCToday(); // 開始日（12時に設定する）
    taskinfo.starttime = UTCCurrentTime(); // 開始時刻
    taskinfo.tag = getTaskItem( id,"tag" ) + ",started"; // started 以外のタグはどうなる？

    var doneFunc = function( data, textState )
    {

        console.log( "startTask : done" );
        if ( data[ 0 ].id != undefined )
        {
            // 計測中のタスクを表示する
            var taskItem = getTaskItem( id );

            // -既に開始しているタスクは赤で表示する
            // -一番最初に捕まえたstartedなタスクをタイマーに表示する
            taskItem.attr( "state", "started" ); // state属性をstartedにする→ cssで表示変更

            var tag = taskObj.attr( "tag" );
            taskItem.attr( "tag", tag + ",started" );

            // 画面の移動
            var position = $( "#titleTargetTask" )
                .scrollTop();
            $( "ons-page" )
                .animate(
                {
                    scrollTop: position
                } );

            // タイマー表示をする
            $( "#timer" )
                .attr( "task", data[ 0 ].id ); // 計測しているtaskのidを登録
            $( "#timer" )
                .removeClass( "completed" );
            $( "#titleTargetTask" )
                .text( data[ 0 ].title ); // タスク名を登録
            $( "#lengthTargetTask" )
                .text( data[ 0 ].length ); // タスク名を登録
            $( "#targetTask" )
                .show(); // タイマーを
            $( "#timer" )
                .show();

            var t = data[ 0 ].starttime;
            var d = data[ 0 ].startdate;
            var c = parseInt( ( new Date() )
                .getTime() / 1000, 10 );

            // カウントダウンタイマーのタイムオーバーが残らないように
            $( "#timer" )
                .removeClass( "timeup" );

            // lengthが0 でカウントアップ
            if ( data[ 0 ].length > 0 )
            {
                console.log( "CountDown : " + data[ 0 ].length );
                idTimer = setInterval( timerCountDown, 1000, ( t - 9 * 60 * 60 ), data[ 0 ]
                    .length );
            }
            else
            {
                idTimer = setInterval( timerCountUp, 1000, ( t - 9 * 60 * 60 ) );
            }
        }

        // lengthが0以外でカウントダウン
        // -設定したスタートタイムからの経過時間で計算する        

        return true;
    };

    var failFunc = function( jqXHR, textState, errorThrown )
    {
        console.log( "completeTask:fail" );
        console.log( jqXHR.responseText ); // レスポンスをテキストでログ出力
        return false;
    };

    return editTasks( taskinfo, doneFunc, failFunc );

}

function editTaskMonaca( taskinfo )
{
    var doneFunc = function( data, textState ) {};
    var failFunc = function( jqXHR, textState, errorThrown )
    {
        alert( "通信に失敗" )
    };

    editTasks( taskinfo, doneFunc, failFunc );
}

// Task Detail ページでタスクを更新した場合の処理
function editThisTask()
{
    console.log("editThisTask");
    
    // タスク情報を集める
    var taskinfo = {};
    taskinfo.id = $( "#pg_taskdetail .task div" )
        .text();
    taskinfo.title = $( "#pg_taskdetail .title div" )
        .text();
    taskinfo.length = $( "#pg_taskdetail .length" )
        .attr( "length" );
    taskinfo.context = $( "#pg_taskdetail .context" )
        .attr( "context" );

    console.log(JSON.stringify(taskinfo));

    // Toodledo上のタスクの修正を行う
    var doneFunc = function( data, textState )
    {
        // tasklistの情報を直す
        editTaskItemElem( taskinfo.id, "length", taskinfo.length );

        // ページをポップする
        document.querySelector( '#myNavigator' )
            .popPage();
    }

    var failFunc = function( jqXHR, textState, errorThrown )
    {
        console.log(jqXHR.responseText);

        // ページをポップする
        document.querySelector( '#myNavigator' )
            .popPage();

    };

    editTasks( taskinfo, doneFunc, failFunc );

}

function finishEditTask()
{
    alert( "hoge" );

    // 変更OKの前提で値を受け取る
    var length = $( "#taskdetail .length input" )
        .val();
    var task = $( "#taskdetail .task" )
        .attr( "task" );

    var taskinfo = {};
    taskinfo.id = task;
    taskinfo.length = length;

    $( "#taskdetail .length" )
        .html( "<div>" + length + "</div>" );

    editTasks( taskinfo, null, null );

    $( "ons-toolbar-button.right ons-icon" )
        .attr( "icon", "ion-compose" );
    $( "ons-toolbar-button.right ons-icon" )
        .attr( "onClick", "editThisTask()" );

}

// タスクリストからタスクの情報を取り出す
function getTaskItem( id )
{
    return $( "#tasklist .task[task='" + id + "']" );
}

// タスクリストからタスクの情報を取り出す
function getTaskItemAttr( id, attr )
{
    return getTaskItem( id )
        .attr( attr ); // taskの属性の情報を更新する
}

// タスクリストの、特定タスクの要素を書き換える
function editTaskItemAttr( id, attr, content )
{
    $( "#tasklist .task[task='" + id + "']" )
        .attr( type, content ); // taskの属性の情報を更新する
    $( "#tasklist .task[task='" + id + "'] div." + attr )
        .text( content ); // 表示の更新
}

// タスクリストの、特定タスクの要素を書き換える
function editTaskItemElem( id, type, content )
{
    console.log("editTaskItemElem");
        
    var task = getTaskItem(id);
    console.log(task.html());
    
    task.attr( type, content ); // taskの属性の情報を更新する
    task.find("div." + type).text( content ); // 表示の更新
}

// Task Detail ページで変更があった場合に、エディットボタンに切り替える
function setEditButton()
{
    // アイコンとクリック動作を切り替え
    $( "#pg_taskdetail ons-toolbar-button.right ons-icon" )
        .attr( "icon", "ion-refresh" );
    $( "#pg_taskdetail ons-toolbar-button.right ons-icon" )
        .attr( "onClick", "editThisTask()" );
}
/* idに該当するHTMLタスクオブジェクトを取得する
function getTaskObject( id )
{
    return $( ".task[task='" + id + "']" );
}
*/


/* カウントアップタイマー */
function timerCountUp( start )
{
    var current = new Date();
    var duration = parseInt( current.getTime() / 1000, 10 ) - start;

    var s = duration % 60;
    duration = duration - s;
    var m = ( duration % 3600 ) / 60;
    duration = duration - 60 * m;
    var h = duration / 3600;

    $( "#timer" )
        .text( h + ":" + ( "00" + m )
            .substr( -2 ) + ":" + ( "00" + s )
            .substr( -2 ) );

}

/* カウントダウンタイマー */
function timerCountDown( start, length )
{
    var current = new Date(); // 現在時刻
    var duration = parseInt( current.getTime() / 1000, 10 ) - start; // 経過時間
    var rest = length * 60 - duration; // 残り時間

    // マイナスになったらカウントアップ
    if ( rest < 0 )
    {
        rest = -rest;
        $( "#timer" )
            .addClass( "timeup" )
    }

    var s = rest % 60;
    rest = rest - s;
    var m = ( rest % 3600 ) / 60;
    rest = rest - 60 * m;
    var h = rest / 3600;


    $( "#timer" )
        .text( h + ":" + ( "00" + m )
            .substr( -2 ) + ":" + ( "00" + s )
            .substr( -2 ) );

}