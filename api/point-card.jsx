import { ImageResponse } from '@vercel/og';

const CARD_BACKGROUND_URL =
  'https://love-better-card.vercel.app/assets/point-card-bg.png';

const FONT_CACHE = new Map();

function clean(value, fallback = '') {
  const result = String(value || '')
    .replace(/\s+/g, ' ')
    .trim();

  return result || fallback;
}

function safeNumber(value, fallback, min, max) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return fallback;
  }

  return Math.min(Math.max(number, min), max);
}

async function loadFont(text, weight) {
  const key = weight + ':' + text;

  if (FONT_CACHE.has(key)) {
    return FONT_CACHE.get(key);
  }

  const promise = (async () => {
    const cssUrl =
      'https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@' +
      weight +
      '&text=' +
      encodeURIComponent(text);

    const cssResponse = await fetch(cssUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:27.0) Gecko/20100101 Firefox/27.0'
      }
    });

    if (!cssResponse.ok) {
      throw new Error('中文字型載入失敗');
    }

    const css = await cssResponse.text();

    const matched =
      css.match(/src:\s*url\(([^)]+)\)/) ||
      css.match(/url\(([^)]+)\)/);

    if (!matched) {
      throw new Error('找不到中文字型網址');
    }

    const fontUrl = matched[1].replace(/['"]/g, '');

    const fontResponse = await fetch(fontUrl);

    if (!fontResponse.ok) {
      throw new Error('中文字型下載失敗');
    }

    return fontResponse.arrayBuffer();
  })();

  FONT_CACHE.set(key, promise);

  return promise;
}

function textBox({
  text,
  left,
  top,
  width,
  height,
  color = '#F04398',
  fontSize = 24,
  fontWeight = 400,
  justifyContent = 'flex-start',
  alignItems = 'flex-start',
  textAlign = 'left',
  lineHeight = 1.2
}) {
  return (
    <div
      style={{
        position: 'absolute',
        left,
        top,
        width,
        height,
        display: 'flex',
        justifyContent,
        alignItems,
        color,
        fontSize,
        fontWeight,
        lineHeight,
        textAlign,
        overflow: 'hidden'
      }}
    >
      {text}
    </div>
  );
}

export default async function handler(req) {
  try {
    const url = new URL(
      req.url || '',
      'https://love-better-card.vercel.app'
    );

    const name = clean(
      url.searchParams.get('name'),
      'LINE好友會員'
    ).slice(0, 14);

    const task = clean(
      url.searchParams.get('task'),
      '探索任務'
    ).slice(0, 24);

    const gain = safeNumber(
      url.searchParams.get('gain'),
      1,
      1,
      99
    );

    const total = safeNumber(
      url.searchParams.get('total'),
      25,
      1,
      99
    );

    const done = safeNumber(
      url.searchParams.get('done'),
      0,
      0,
      total
    );

    const remain = safeNumber(
      url.searchParams.get('remain'),
      Math.max(total - done, 0),
      0,
      total
    );

    const remainingText =
      remain <= 0
        ? '探索旅程已完成，已取得日本來回機票資格'
        : '探索體驗還差 ' +
          remain +
          ' 點，即可獲得日本來回機票';

    const fontText = [
      'Love Better',
      '探索完成通知',
      '你已完成',
      '本次獲得點數',
      '目前探索旅程進度',
      '點',
      '查看我的集點卡',
      '探索體驗還差',
      '即可獲得日本來回機票',
      '探索旅程已完成，已取得日本來回機票資格',
      name,
      task,
      '+' + gain,
      done + '/' + total,
      remain
    ].join('');

    const regularFont = await loadFont(fontText, 400);
    const boldFont = await loadFont(fontText, 700);

    const taskFontSize =
      task.length > 16
        ? 28
        : task.length > 11
          ? 34
          : 42;

    const nameFontSize =
      name.length > 9
        ? 25
        : 30;

    return new ImageResponse(
      (
        <div
          style={{
            position: 'relative',
            width: '640px',
            height: '640px',
            display: 'flex',
            overflow: 'hidden',
            backgroundColor: '#f5abc6',
            fontFamily: 'Noto Sans TC'
          }}
        >
          <img
            src={CARD_BACKGROUND_URL}
            width="640"
            height="640"
            style={{
              position: 'absolute',
              left: '0px',
              top: '0px',
              width: '640px',
              height: '640px'
            }}
          />

          {textBox({
            text: '探索完成通知',
            left: '42px',
            top: '93px',
            width: '556px',
            height: '52px',
            color: '#ef4398',
            fontSize: 43,
            fontWeight: 700
          })}

          {textBox({
            text: name + '　你已完成：',
            left: '42px',
            top: '169px',
            width: '556px',
            height: '40px',
            color: '#e86aa8',
            fontSize: nameFontSize,
            fontWeight: 400
          })}

          {textBox({
            text: task,
            left: '42px',
            top: '211px',
            width: '556px',
            height: '74px',
            color: '#ef4398',
            fontSize: taskFontSize,
            fontWeight: 700,
            lineHeight: 1.12
          })}

          {textBox({
            text: '本次獲得點數',
            left: '65px',
            top: '288px',
            width: '205px',
            height: '34px',
            color: '#62575d',
            fontSize: 20,
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center'
          })}

          {textBox({
            text: '目前探索旅程進度',
            left: '365px',
            top: '288px',
            width: '220px',
            height: '34px',
            color: '#62575d',
            fontSize: 20,
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center'
          })}

          <div
            style={{
              position: 'absolute',
              left: '91px',
              top: '326px',
              width: '150px',
              height: '150px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              border: '8px solid #ef4398',
              borderRadius: '999px',
              backgroundColor: '#f8c7da'
            }}
          >
            <div
              style={{
                display: 'flex',
                color: '#ef4398',
                fontSize: '65px',
                fontWeight: 700,
                lineHeight: 0.9
              }}
            >
              +{gain}
            </div>

            <div
              style={{
                display: 'flex',
                color: '#ef4398',
                fontSize: '25px',
                fontWeight: 700,
                marginTop: '7px'
              }}
            >
              點
            </div>
          </div>

          <div
            style={{
              position: 'absolute',
              left: '394px',
              top: '326px',
              width: '150px',
              height: '150px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '4px solid #ef4398',
              borderRadius: '999px',
              backgroundColor: '#f8c7da',
              color: '#ef4398',
              fontSize: '43px',
              fontWeight: 700
            }}
          >
            {done}/{total}
          </div>

          {textBox({
            text: remainingText,
            left: '42px',
            top: '500px',
            width: '556px',
            height: '42px',
            color: '#5d5559',
            fontSize: 24,
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center'
          })}

          <div
            style={{
              position: 'absolute',
              left: '76px',
              top: '552px',
              width: '488px',
              height: '70px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              borderRadius: '999px',
              backgroundColor: '#ffffff',
              color: '#55545a',
              fontSize: '34px',
              fontWeight: 700
            }}
          >
            查看我的集點卡
          </div>
        </div>
      ),
      {
        width: 640,
        height: 640,
        fonts: [
          {
            name: 'Noto Sans TC',
            data: regularFont,
            weight: 400
          },
          {
            name: 'Noto Sans TC',
            data: boldFont,
            weight: 700
          }
        ]
      }
    );
  } catch (error) {
    return new Response(
      '圖卡生成失敗：' +
        (error && error.message ? error.message : String(error)),
      {
        status: 500,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8'
        }
      }
    );
  }
}
