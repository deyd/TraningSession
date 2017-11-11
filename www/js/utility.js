/* 時間を日本時間に変えて、年月日時分表現にする (-9時間) */
function UTCtoTimeStringJapan( utctime )
{

    // 現在時刻を返す #### Toodledo は秒単位なのでミリ秒に変換
    var date = new Date( ( utctime - 9 * 60 * 60 ) * 1000 );
    return DateToTimeString( date );
}

/* 時間を日本時間に変えて、年月日時分表現にする (-9時間) */
function UTCtoDateStringJapan( utctime )
{

    // 現在時刻を返す #### Toodledo は秒単位なのでミリ秒に変換
    var date = new Date( ( utctime - 9 * 60 * 60 ) * 1000 );
    return DateToDateString( date );
}

/* 時間を年月日時分表現にする */
function UTCtoTimeString( utctime )
{
    // 現在時刻を返す #### Toodledo は秒単位なのでミリ秒に変換
    var date = new Date( utctime * 1000 );
    return DateToTimeString( date );
}

/* 時間を年月日表現にする */
function UTCtoDateString( utctime )
{
    // 現在時刻を返す #### Toodledo は秒単位なのでミリ秒に変換
    var date = new Date( utctime * 1000 );
    return DateToDateString( date );
}


/* dateオブジェクトを年月日時分表現にする */
function DateToTimeString( date )
{
    var yr = date.getFullYear();
    var mo = ( "00" + ( date.getMonth() + 1 ) )
        .substr( -2 ); // 0から始まるのでオフセット
    var dt = ( "00" + date.getDate() )
        .substr( -2 );
    var hr = ( "00" + date.getHours() )
        .substr( -2 );
    var mi = ( "00" + date.getMinutes() )
        .substr( -2 );

    return yr + "/" + mo + "/" + dt + " " + hr + ":" + mi;
}

/* dateオブジェクトを年月日表現にする */
function DateToDateString( date )
{
    var yr = date.getFullYear();
    var mo = ( "00" + ( date.getMonth() + 1 ) )
        .substr( -2 ); // 0から始まるのでオフセット
    var dt = ( "00" + date.getDate() )
        .substr( -2 );

    return yr + "/" + mo + "/" + dt;
}


/* 日本の現在時刻を表現するUTCで返す */
function UTCCurrentTimeJapan()
{
    var date = new Date();
    date.setHours( date.getHours() ); // 現地時間に合わせる
    var utc = parseInt( date.getTime() / 1000, 10 );
    return utc;
}


/* 現在時刻をUTCで返す */
function UTCCurrentTime()
{
    var date = new Date();
    date.setHours( date.getHours() + 9 ); // 現地時間に合わせる
    var utc = parseInt( date.getTime() / 1000, 10 );
    return utc;
}

/* 今日の12時のUTC時間を返す */
function UTCToday()
{
    var date = new Date();
    date.setHours( 12 + 9 ); // 現地時間に合わせる
    date.setMinutes( 0 ); // 現地時間に合わせる
    date.setSeconds( 0, 0 ); // 現地時間に合わせる
    var utc = parseInt( date.getTime() / 1000, 10 );
    return utc;

}

/* 分を00:00の形式に変更する */
function MINUTEtoHHMM( t )
{
    var mi = t % 60;
    var hr = ( t - mi ) / 60;
    return hr + ":" + ( "00" + mi )
        .substr( -2 );
}