function WorkMeisterReady()
{
    // タスクリストでタスクをクリック → 詳細（編集）画面
    $( document )
        .on( "click", "#pg_tasklist .task", function()
        {
            // <ons-row class="task"> が持つタスク情報をすべて格納する
            var data = {};
            data.task = $( this )
                .attr( "task" );
            data.title = $( this )
                .attr( "title" );
            data.context = $( this )
                .attr( "context" );
            data.length = $( this )
                .attr( "length" );
            data.folder = $( this )
                .attr( "folder" );
            data.startdate = $( this )
                .attr( "startdate" );
            data.starttime = $( this )
                .attr( "starttime" );
            data.duedate = $( this )
                .attr( "duedate" );
            data.duetime = $( this )
                .attr( "duetime" );
            data.tags = $( this )
                .attr( "tags" );

            // data情報を送り、ページをプッシュする
            document.querySelector( '#myNavigator' )
                .pushPage( 'taskdetail.html',
                {
                    data: data
                } );
        } );

    // タスクリストでタスクを左スワイプ　→　タスク完了・削除
    $( document )
        .on( "swipeleft", ".task", function()
        {
            postponeTask( $( this )
                .attr( "task" ) );

        } );

    // タスクリストでタスクをホールド　→　タスク完了・削除
    $( document )
        .on( "hold", "#pg_tasklist .task", function()
        {
            var attrTitle = $( this )
                .attr( "title" );
            var attrId = $( this )
                .attr( "task" ); // 確認用                        

            var b = ons.notification.confirm(
            {
                message: "\"" + attrTitle + "\"を完了/削除しますか",
                buttonLabels: [ "Cancel", "中断", "完了" ]
            } );

            b.then( function( i )
            {
                console.log( i );
                switch ( i )
                {
                    case 2:
                        // 完了
                        completeTaskMonaca( attrId );
                        break;
                    case 1:
                        // 中断
                        deleteTaskMonaca( attrId );
                        break;
                    default:
                        break;
                }

            } );
        } );

    // タスクリストでタスクを右スワイプ
    //　　　→　タスクが未開始なら開始
    //　　　→　タスクが開始済なら完了
    $( document )
        .on( "swiperight", ".task", function()
        {
            console.log( "swipeleft" )

            var attrTag = $( this )
                .attr( "tag" ); // タスクのtagを読み出す
            attrTag = attrTag.replace( /\s+/g, "" ); // 空白を削除する
            var tags = attrTag.split( "," ); // カンマで分ける

            if ( tags.indexOf( "started" ) == -1 )
            {
                // 二重起動防止
                if ( idTimer == null )
                {
                    startTaskMonaca( $( this )
                        .attr( "task" ) );
                }
            }
            else
            {
                ons.notification.toast(
                {
                    message: "すでに開始しているタスクです。",
                    timeout: 1000
                } );
                completeTaskMonaca( $( this )
                    .attr( "task" ) );
            }

            // "started"が入っていないか確認する

        } );

    // タイマーをクリック
    $( document )
        .on( "click", "#timer", function()
        {
            var taskId = $( this )
                .attr( "task" );
            // タイマーが起動していれば、停止してタスク完了／中断
            if ( idTimer )
            {
                clearInterval( idTimer );

                var p = ons.notification.confirm(
                {
                    message: "停止しました",
                    buttonLabels: [ "中断", "完了" ]
                } );

                p.then( function( i )
                {
                    if ( i == 0 )
                    {
                        // 中断
                        getTaskObject( taskId )
                            .attr( "state", "" );
                    }
                    else if ( i == 1 )
                    {
                        // 完了
                        completeTaskMonaca( taskId );

                    }
                } );

                ons.notification.toast(
                {
                    message: 'タイマーを停止しました。',
                    timeout: 2000
                } );
                idTimer = null;
            }
        } );

    /* taskdetailページ遷移時に情報を渡す */
    $( document )
        .on( "pageinit", "#pg_taskdetail", function()
        {
            // 送られてきたデータの取り出し
            var data = myNavigator.topPage.data;

            // データを格納（表示とは別）
            setDatas( data, "task" );
            setDatas( data, "title" );
            setDatas( data, "length" );
            setDatas( data, "context" );
            setDatas( data, "folder" );
            setDatas( data, "startdate" );
            setDatas( data, "starttime" );
            setDatas( data, "duedate" );
            setDatas( data, "duetime" );
            setDatas( data, "tags" );

            // 表示データの上書き作成
            $( "#pg_taskdetail .context div" )
                .text( contextlist[ data.context ] );
            $( "#pg_taskdetail .folder div" )
                .text( folderlist[ data.folder ] );

            // startdateの表示
            if ( data.duedate != 0 && data.duedate != undefined )
            {
                $( "#pg_taskdetail .duedate div" )
                    .text( UTCtoDateStringJapan( data.duedate ) );
            }
            else
            {
                $( "#pg_taskdetail .duedate div" )
                    .text( "No DueDate" );
            }

            // duetimeの表示
            if ( data.duetime != 0 && data.duetime != undefined )
            {
                $( "#pg_taskdetail .duetime div" )
                    .text( UTCtoDateStringJapan( data.duetime ) );
            }
            else
            {
                $( "#pg_taskdetail .duetime div" )
                    .text( "No DueTime" );
            }
            // startdateの表示
            if ( data.startdate != 0 && data.startdate != undefined )
            {
                $( "#pg_taskdetail .startdate div" )
                    .text( UTCtoDateStringJapan( data.startdate ) );
            }
            else
            {
                $( "#pg_taskdetail .startdate div" )
                    .text( "No StartDate" );
            }

            // starttimeの表示
            if ( data.starttime != 0 && data.starttime != undefined )
            {
                $( "#pg_taskdetail .starttime div" )
                    .text( UTCtoDateStringJapan( data.starttime ) );
            }
            else
            {
                $( "#pg_taskdetail .starttime div" )
                    .text( "No StartTime" );
            }

        } );

    $( document )
        .on( "click", "#pg_taskdetail .context div", function()
        {
            // context情報を読み出す
            var select = $( this )
                .next(); // ons-row.context
            var value = $( this )
                .parent()
                .attr( "context" ); // 表示ではなく、contextのid値

            // div を隠して、 input を表示させる
            $( this )
                .hide();
            select.val( value );
            select.show();
        } );

    $( document )
        .on( "change", "#pg_taskdetail .context select", function()
        {

            // context情報を読み出す
            var context_select = $( this )
                .val();
            var text_select = $( "option:selected", this )
                .text();

            // div を隠して、 input を表示させる
            var div = $( this ).prev();
            var context_div = div.attr("context");

            // 値が分かっている場合の処理
            if ( context_div != context_select )
            {
                $(this).parent().attr("context", context_select);
                div.text( text_select );    // テキスト書き換え
                setEditButton();// アイコンとクリック動作を切り替え
            }

            // 表示を切り替える
            $( this ).hide();
            div.show();

        } );


    $( document )
        .on( "click", "#pg_taskdetail .length div", function()
        {

            // length情報を読み出す
            var input = $( this )
                .next(); // ons-row.length
            var value = $( this )
                .text();

            // div を隠して、 input を表示させる
            $( this )
                .hide();
            input.val( value );
            input.show();

        } );

    $( document )
        .on( "blur", "#pg_taskdetail .length input", function()
        {
            var input = $( this ); // input を明示的に

            // input から値を取得する
            var val_input = $( this )
                .val();

            // （以前の）div の値を取得する
            var div = $( this )
                .prev();
            var val_div = div.text();

            // 値が分かっている場合の処理
            if ( val_input != val_div )
            {
                // エディットマークを付ける
                div.text( val_input );
                setEditButton();    // アイコンとクリック動作を切り替え
            }

            // 表示を切り替える
            input.hide();
            div.show();

        } );

    /* taskaddページ遷移時に情報を渡す */
    $( document )
        .on( "pageinit", "#taskadd", function()
        {
            var page = myNavigator.topPage;

            console.log( "taskadd pageload" );

            $( "#taskadd .length input" )
                .val( 0 );
        } );

}