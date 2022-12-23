const { app, BrowserWindow, desktopCapturer, ipcMain } = require("electron");
const path = require("path");

// メインウィンドウ
let mainWindow;

const createWindow = () => {
  // メインウィンドウを作成します
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      // プリロードスクリプトは、レンダラープロセスが読み込まれる前に実行され、
      // レンダラーのグローバル（window や document など）と Node.js 環境の両方にアクセスできます。
      nodeIntegration: false,
      contextIsolation: false,
      //webSecurity:false,
      preload: path.join(__dirname, "preload.js"),
    },
  });
  // デベロッパーツールの起動
  mainWindow.webContents.openDevTools();

  // メインウィンドウに表示するURLを指定します
  // （今回はmain.jsと同じディレクトリのindex.html）
  //mainWindow.loadURL("http://localhost:8080")
  //mainWindow.loadURL("https://zoom.us/wc/5805902106/join?from=join&_x_zm_rtaid=TcVa1UJaRJGASD8PCvtldg.1671087863295.586b09088baae49cb3be8c79b1b70546&_x_zm_rhtaid=290");
  mainWindow.loadFile("index.html");


  // メインウィンドウが閉じられたときの処理
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
};

//  初期化が完了した時の処理
app.whenReady().then(() => {
  createWindow();

  // アプリケーションがアクティブになった時の処理(Macだと、Dockがクリックされた時）
  app.on("activate", () => {
    // メインウィンドウが消えている場合は再度メインウィンドウを作成する
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// 全てのウィンドウが閉じたときの処理
app.on("window-all-closed", () => {
  // macOSのとき以外はアプリケーションを終了させます
  if (process.platform !== "darwin") {
    app.quit();
  }
});

ipcMain.handle('capture-screen', async (_e, _arg) => {
  return desktopCapturer.getSources({ types: ['window', 'screen'] }).then(async sources => {
    // let names = ""
    // for (const source of sources) {
    //   //if (source.name === 'Electron') {
    //   //  //mainWindow.webContents.send('SET_SOURCE', source.id)
    //   //  return
    //   //}
    //   names += source.name
    // }
    return sources
  })

  //return "aaabbbccc"
  // return dialog
  //   // ファイル選択ダイアログを表示する
  //   .showOpenDialog(mainWindow, {
  //     properties: ['openFile'],
  //   })
  //   .then((result) => {
  //     // キャンセルボタンが押されたとき
  //     if (result.canceled) return '';

  //     // 選択されたファイルの絶対パスを返す
  //     return result.filePaths[0];
  //   });
});
// desktopCapturer.getSources({ types: ['window', 'screen'] }).then(async sources => {
//   console.log(sources)
//   for (const source of sources) {
//     if (source.name === 'Electron') {
//       //mainWindow.webContents.send('SET_SOURCE', source.id)
//       return
//     }
//   }
// })

//console.log(desktopCapturer)
// desktopCapturer.getSources({types: ['window', 'screen']}, (error, sources) => {
//     if (error) throw error
//     // for (let i = 0; i < sources.length; ++i) {
//     //   if (sources[i].name === 'Electron') {
//     //     navigator.mediaDevices.getUserMedia({
//     //       audio: false,
//     //       video: {
//     //         mandatory: {
//     //           chromeMediaSource: 'desktop',
//     //           chromeMediaSourceId: sources[i].id,
//     //           minWidth: 1280,
//     //           maxWidth: 1280,
//     //           minHeight: 720,
//     //           maxHeight: 720
//     //         }
//     //       }
//     //     })
//     //     .then((stream) => handleStream(stream))
//     //     .catch((e) => handleError(e))
//     //     return
//     //   }
//     // }
//   })

  
//   function handleStream (stream) {
//     // const video = document.querySelector('video')
//     // video.srcObject = stream
//     // video.onloadedmetadata = (e) => video.play()
//   }
  
//   function handleError (e) {
//     console.log(e)
//   }