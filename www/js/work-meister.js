//
// saveDataLocalStorage(key, value);



// This is a JavaScript file
var bRetry = false;

var folderlist = {
    0: "No FOLDER",
    3901305: "DH材加工長寿命化",
    3803161: "Dプロ",
    3788507: "GTD",
    3617103: "その他業務",
    3901303: "ダントツ造型工場",
    3578172: "プライベート",
    3584622: "冷却穴平滑化",
    3798479: "加工プロセス再構築",
    3901301: "次世代造型工場構想",
    3578166: "深穴高能率化",
    3866827: "移動",
    3641963: "走る",
    3901307: "長寿命刃具",
    3931123: "難削材加工"
};

var contextlist = {
    1326819: "A_0000-0630",
    1230639: "B_0630-0800",
    1230641: "C_0800-1000",
    1230643: "D_1000-1200",
    1230645: "E_1200-1300",
    1235454: "F_1300-1500",
    1237038: "G_1500-1700",
    1326821: "H_1700-1900",
    1326823: "J_1900-2100",
    1326825: "K_2100-2300",
    1326827: "L_2300-0000",
    1354717: "Z_started"
};

var contextlist2 = [
        [ "1326819", "A_0000-0630" ],
        [ "1230639", "B_0630-0800" ],
        [ "1230641", "C_0800-1000" ],
        [ "1230643", "D_1000-1200" ],
        [ "1230645", "E_1200-1300" ],
        [ "1235454", "F_1300-1500" ],
        [ "1237038", "G_1500-1700" ],
        [ "1326821", "H_1700-1900" ],
        [ "1326823", "J_1900-2100" ],
        [ "1326825", "K_2100-2300" ],
        [ "1326827", "L_2300-0000" ],
        [ "1354717", "Z_started" ]
    ]


/* code をもちいてAccessTokenを取得し、ストレージに登録する
   成功したらアクセストークンを、失敗したら null を返す */
function getTokenWithCode( code )
{
    // AJAX通信(ver1.8...)
    var request = $.ajax(
    {
        type: 'POST', // GET,POST
        data:
        { // Dataプロパティはデータを送信（渡す）役目
            client_id: "WMmonaca",
            client_secret: "api59ce1ca19bb47",
            grant_type: "authorization_code",
            code: code,
        },
        dataType: "json",
        url: "https://api.toodledo.com/3/account/token.php",
        async: true, // 非同期=true・同期=false
        cache: false, // 初期値はtrueでキャッシュする状態
        timeout: 10000,
        beforeSend: function( xhr )
        {
            xhr.overrideMimeType( "text/html;charset=UTF-8" );
        }
    } );

    request.done( function( data, textState )
    {
        console.log( data ); // 戻り値

        // ローカルデータベースに保存
        saveDataLocalStorage( "ToodledoAccessToken", data.access_token );
        saveDataLocalStorage( "ToodledoRefreshToken", data.refresh_token );

        return data.access_token;

    } );

    request.fail( function( data, textState )
    {
        console.log( "request fail" );
        console.log( data.errorCode );
        console.log( data.errorDesc );
        console.log( textState );

        return null;
    } );

}

/* ローカルから順番にアスセストークンを探す */
function prepareAccessToken()
{
    // アクセストークンを準備する
    var access_token = loadDataLocalStorage( "ToodledoAccessToken" );

    // ローカルになかったらリフレッシュトークンを使う
    if ( access_token == null )
    {
        var refresh_token = loadDataLocalStorage( "ToodledoRefreshToken" );
        
        
        if ( refresh_token == null )
        {
            // リフレッシュトークンも見つからなかったら、認証を貰いに行く
            return authorizeWithBrowser();
        }
        else
        {
            // リフレッシュトークンがあれば、リフレッシュトークンで更新を掛ける
            return getTokenRefresh( refresh_token );
        }
    }

    return access_token;

}

/* リフレッシュトークンを使って、新しいトークンを取得する
　　取得できたら新しいアクセストークンを、できなかったら null を返す */
function refreshToken( refresh_token )
{
    console.log( "refreshToken start" );

    if ( refresh_token == null ) return 0;
    console.log( "ToodledoRefreshToken : " + refresh_token );

    // AJAX通信(ver1.8...)
    var request = $.ajax(
    {
        type: 'POST', // GET,POST
        data:
        { // Dataプロパティはデータを送信（渡す）役目
            client_id: "WMmonaca",
            client_secret: "api59ce1ca19bb47",
            refresh_token: refresh_token,
            grant_type: "refresh_token"
        },
        dataType: "json",
        url: "https://api.toodledo.com/3/account/token.php",
        async: false, // 同期=false
        cache: false, // 初期値はtrueでキャッシュする状態
        timeout: 10000,
        beforeSend: function( xhr )
        {
            xhr.overrideMimeType( "text/html;charset=UTF-8" );
        }
    } );

    // 通信に成功した場合
    request.done( function( data, textState )
    {
        console.log( "refreshToken:done" );

        // ローカルデータベースに保存
        saveDataLocalStorage( "ToodledoAccessToken", data.access_token );
        saveDataLocalStorage( "ToodledoRefreshToken", data.refresh_token );

        return data.access_token;
    } );

    // 通信に失敗した場合、リフレッシュトークンでのトークン交換を試みる
    request.fail( function( jqXHR, textState, errorThrown )
    {
        console.log( "refreshToken:fail" );
        console.log( jqXHR.responseText ); // レスポンスをテキストでログ出力

        return null;
    } );

    // request.always( function( data, textState ){} );

}

/* Toodledoからタスクを取得する */
function retrieveTasks(filter,doneFunc,failFunc)
{
    console.log( "retrieveTasks" );

    // アクセストークンを準備する
    var access_token = prepareAccessToken();

    var data = {};
    data.client_id = "WorkMeisterApp";
    data.client_secret = "api58a446ba9e608";
    data.access_token = access_token;

    $.extend(data,filter);  // フィルターを結合

    // AJAX通信(ver1.8...)
    var request = $.ajax(
    {
        type: 'POST', // GET,POST
        data: data,
        dataType: "json",
        url: "https://api.toodledo.com/3/tasks/get.php",
        async: true, // 非同期=true・同期=false
        cache: false, // 初期値はtrueでキャッシュする状態
        timeout: 10000,
        beforeSend: function( xhr )
        {
            xhr.overrideMimeType( "text/html;charset=UTF-8" );
        }
    } );

    // 通信に成功した場合
    request.done(doneFunc);

    // 通信に失敗した場合
    request.fail(failFunc);

    request.always( function( data, textState )
    {
        // console.log( data.toString() );
    } );
}

/* タスクリストのタスク数を更新する */
function updateNumberOfTasks()
{
    $( "#task_num" )
        .html( $( "#tasklist" )
            .children( ".task" )
            .length );
}

/* タスクリストの予想時間を更新する */
function updateTimeOfTasks()
{

    var totaltime = 0;

    $( "#tasklist" )
        .children( ".task" )
        .each( function( i, e )
        {
            totaltime = totaltime + parseInt( $( e )
                .attr( "length" ), 10 );
        } );

    $( "#task_totaltime" )
        .html( MINUTEtoHHMM( totaltime ) );
}

/* Toodledoに該当タスクの完了を上げる
  完了時間は細かく記録されないので、期限日時に入力しておく */
function completeTask( id, donefunc, failfunc )
{
    // タスク情報
    var taskinfo = {};
    taskinfo.id = id;
    taskinfo.completed = UTCCurrentTime();
    taskinfo.duedate = UTCCurrentTime();
    taskinfo.duetime = UTCCurrentTime();

    return editTasks( taskinfo, donefunc, failfunc );
}

/* タスクの開始処理をしてタイマーを起動させる */
function startTask( id, doneFunc, failFunc )
{
    console.log( "startTask" );
    scrollTo( 0, 100 );
    // 開始時刻を設定する
    // -starttimeに開始時間を設定する

    var tags = getTags( id );

    // タスク情報
    var taskinfo = {};
    taskinfo.id = id;
    taskinfo.startdate = UTCToday(); // 開始日（12時に設定する）
    taskinfo.starttime = UTCCurrentTime(); // 開始時刻
    taskinfo.tag = "started"; // started 以外のタグはどうなる？

    return editTasks( taskinfo, doneFunc, failFunc );

}

/* タスクを延期する（明日にする） */
function postponeTask( id )
{

    var taskinfo = {};
    taskinfo.id = id;
    taskinfo.duedate = UTCToday() + 24 * 60 * 60;

    var doneFunc = function( data, textState )
    {
        console.log( "postponeTask : done" );

        for ( var i = 0; i < data.length; i++ )
        {
            if ( data[ i ].id != undefined )
            {
                // タスクを消す
                getTaskItem( data[ i ].id )
                    .remove();
                ons.notification.toast(
                {
                    "message": "明日へ延期：\"" + data[ i ].title + "\"",
                    "timeout": 1500
                } );
            }
        };

        updateNumberOfTasks();
        updateTimeOfTasks();

    };

    var failFunc = function( jqXHR, textState, errorThrown ) {};

    editTasks( taskinfo, doneFunc, failFunc );

};

/* Toodledo に Editting Tasks を投げる */
function editTasks( taskinfo, doneFunc, failFunc )
{
    // アクセストークンを準備する
    var access_token = prepareAccessToken();

    // AJAX通信(ver1.8...)
    var request = $.ajax(
    {
        type: 'POST', // GET,POST
        data:
        { // Dataプロパティはデータを送信（渡す）役目
            client_id: "WorkMeisterApp",
            client_secret: "api58a446ba9e608",
            access_token: access_token,
            tasks: JSON.stringify( taskinfo ),
            fields: "folder,star,startdate,starttime,length"
        },
        dataType: "json",
        url: "http://api.toodledo.com/3/tasks/edit.php",
        async: true, // 非同期=true・同期=false
        cache: false, // 初期値はtrueでキャッシュする状態
        timeout: 10000,
        beforeSend: function( xhr )
        {
            xhr.overrideMimeType( "text/html;charset=UTF-8" );
        }
    } );

    // 通信に成功した場合
    request.done( doneFunc );

    // 通信に失敗した場合
    request.fail( function( qXHR, textState, errorThrown )
    {
        if ( failFunc != null )
        {
            failFunc( qXHR, textState, errorThrown );   // 定義してあればそのまま流す
        }
    } );

    request.always( function( data, textState )
    {
        // console.log( data.toString() );
    } );

}


/* Toodledo の Folderの情報を取る */
function getFolders()
{
    console.log( "getFolders : start" );

    // 通信に成功した場合
    var doneFunc = function( data, textState )
    {
        console.log( "getFolders : done" );

        for ( var i = 0; i < data.length; i++ )
        {
            // タスクを消す
            console.log( data[ i ].id + " " + data[ i ].name ); // レスポンスをテキストでログ出力
            folderlist[ data[ i ].id ] = data[ i ].name;
        }
    };

    getInfo( "http://api.toodledo.com/3/folders/get.php", doneFunc, null );

}

/* **** */
function addTasks( taskinfo, doneFunc, failFunc )
{

    console.log( "addTasks called." );

    //  tasks/add.php
    //  tasks=[{"title":"My Task"},{"title":"Another","star":"1","ref":"98765"},{"title":"","ref":"1234"}]
    //  fields=folder,star

    //  必須のパラメータ : title
    //  任意のパラメータ : folder, context, goal, location, priority, status,star, duration, remind, starttime, duetime, completed, duedatemod, repeat, tag, duedate, startdate, note, parent, meta (see above for possible values).
    //  パラメータ（フィールド）は、JSONオブジェクトとして渡す。

    // アクセストークンを準備する
    var access_token = prepareAccessToken();

    // AJAX通信(ver1.8...)
    var request = $.ajax(
    {
        type: 'POST', // GET,POST
        data:
        { // Dataプロパティはデータを送信（渡す）役目
            client_id: "WorkMeisterApp",
            client_secret: "api58a446ba9e608",
            access_token: access_token,
            tasks: JSON.stringify( taskinfo ),
            fields: "folder,star,startdate,starttime,length"
        },
        dataType: "json",
        url: "http://api.toodledo.com/3/tasks/add.php",
        async: true, // 非同期=true・同期=false
        cache: false, // 初期値はtrueでキャッシュする状態
        timeout: 10000,
        beforeSend: function( xhr )
        {
            xhr.overrideMimeType( "text/html;charset=UTF-8" );
        }
    } );

    // 取得に成功した場合
    request.done( function( data, textState )
    {
        console.log( "request.done" );

        if ( doneFunc == null )
        {
            console.log( "default done-function is executing." );
            console.log( JSON.stringify( data ) );
            console.log( textState );
        }
        else
        {
            console.log( "custom done-function will execute." );
            doneFunc( data, textState );
        }
    } );

    // 取得にに失敗した場合
    request.fail( function( jqXHR, textState, errorThrown )
    {
        console.log( "request.fail" );

        if ( failFunc == null )
        {
            console.log( "default-fail-function is executing." );
            console.log( JSON.stringify( jqXHR ) );
            console.log( textState );
        }
        else
        {
            console.log( "custom-fail-function is executing." );
            failFunc( jqXHR, textState, errorThrown );
        }
    } );

    request.always( function( data, textState )
    {
        // console.log( JSON.stringify( data ) );
    } );

}

/* コンテクストリストを取得する */
function getContexts()
{
    /* 通信成功時のデータ処理 */
    var doneFunc = function( data, textState )
    {
        console.log( "getContexts : done" );

        for ( var i = 0; i < data.length; i++ )
        {
            contextlist[ data[ i ].id ] = data[ i ].name;
        }
    };

    getInfo( "http://api.toodledo.com/3/contexts/get.php", doneFunc, null );
}

/* folder, context, などの取得に使用する関数 */
function getInfo( url, doneFunc, failFunc )
{

    // アクセストークンを準備する
    var access_token = prepareAccessToken();

    // AJAX通信(ver1.8...)
    var request = $.ajax(
    {
        type: 'POST', // GET,POST
        data:
        { // Dataプロパティはデータを送信（渡す）役目
            client_id: "WorkMeisterApp",
            client_secret: "api58a446ba9e608",
            access_token: access_token
        },
        dataType: "json",
        url: url,
        async: true, // 非同期=true・同期=false
        cache: false, // 初期値はtrueでキャッシュする状態
        timeout: 10000,
        beforeSend: function( xhr )
        {
            xhr.overrideMimeType( "text/html;charset=UTF-8" );
        }
    } );

    // 通信に成功した場合
    request.done( doneFunc );

    var defaultFailFunc = function( jqXHR, textState, errorThrown )
    {
        console.log( jqXHR.responseText ); // レスポンスをテキストでログ出力
    }

    // 通信に失敗した場合の関数
    if ( failFunc == null )
    {
        request.fail( defaultFailFunc );
    }
    else
    {
        request.fail( failFunc );
    }

    request.always( function( data, textState )
    {
        // console.log( data.toString() );
    } );
}

/* folder, context, などの取得に使用する関数 */
function deleteTask( id )
{

    // アクセストークンを準備する
    var access_token = prepareAccessToken();

    var taskId = [];
    taskId[ 0 ] = id;

    // AJAX通信(ver1.8...)
    var request = $.ajax(
    {
        url: "http://api.toodledo.com/3/tasks/delete.php",
        type: 'POST', // GET,POST
        data:
        { // Dataプロパティはデータを送信（渡す）役目
            client_id: "WorkMeisterApp",
            client_secret: "api58a446ba9e608",
            access_token: access_token,
            tasks: taskId.toString()
        },
        dataType: "json",
        async: true, // 非同期=true・同期=false
        cache: false, // 初期値はtrueでキャッシュする状態
        timeout: 10000,
        beforeSend: function( xhr )
        {
            xhr.overrideMimeType( "text/html;charset=UTF-8" );
        }
    } );


    // 通信に成功した場合
    request.done( function( data, textState )
    {
        console.log( "deleteTask : done" );
        console.log( JSON.stringify( data ) );

        for ( var i = 0; i < data.length; i++ )
        {
            if ( data[ i ].id != undefined )
            {
                // タスクを消す
                getTaskItem( data[ i ].id )
                    .remove();
                ons.notification.toast(
                {
                    "message": "\"" + data[ i ].title + "\"を削除しました",
                    "timeout": 1500
                } );
            }
        }

        updateNumberOfTasks();
        updateTimeOfTasks();

        return true;
    } );

    request.fail( function( jqXHR, textState, errorThrown )
    {
        console.log( jqXHR.responseText ); // レスポンスをテキストでログ出力
    } );

    request.always( function( data, textState )
    {
        // console.log( data.toString() );
    } );
}

function editTaskDetail()
{
    var title = $( "#task_title" )
        .text();
    $( "#task_title" )
        .empty();
    $( "#task_title" )
        .append( "<ons-input id='task_title' value='" + title + "'></ons-input>" );
}