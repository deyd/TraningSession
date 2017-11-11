
/* tasklist.html */
function jumpToTaskAdd()
{
    var data = {};
    data.length = 30;

    document.querySelector( '#myNavigator' )
        .pushPage( 'taskadd.html',
        {
            data: data
        } );
}

// リストにヘッダを準備する。
// ヘッダの順番が変わるので、直書き
function putHeaders()
{

    $( "#tasklist" )
        .empty();

    for ( var i = 0; i < contextlist2.length; i++ )
    {
        $( "#tasklist" )
            .append( '<div class="header" context="' + contextlist2[ i ][ 0 ] + '">' + contextlist2[
                i ][ 1 ] + '</div>' );
    }
    $( "#tasklist" )
        .append( '<div class="header" context="0">header</div>' );

};

/****************/
/* taskdetail.html */
/****************/

/* 要素を取り出して、そのままセットしていく */
function setDatas(data, name)
{
    var elem = data[name];
    $( "#pg_taskdetail ." + name +" div" )
        .text( elem );  // 表示するテキストにセット
    $( "#pg_taskdetail ." + name )
        .attr( name, elem );    // 要素の属性にセット

}


/****************/
/* taskadd.html */
/****************/

function onloadTaskAdd(){
    console.log("onloadTaskAdd");
}

// taskadd.html toolbar editButton
function addTaskButton(){

    // 登録するタスク情報を作る
    var taskinfo = {};
    taskinfo.title = $("#taskadd .title input").val(); 
    taskinfo.context = $("#taskadd .context select").val();
    taskinfo.length = $("#taskadd .length input").val();

    // タスクの追加
    addTasks(taskinfo,null,null);
}

function changeLength(){
    console.log("aaa");
    $("#taskadd .length-value").text($("#taskadd .length input").val());      
}

function info(){
    console.log($("#taskadd .length input").val());  
}