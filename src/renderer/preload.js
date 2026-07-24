'use strict';
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('bailing', {
  onRecordStart: (cb) => ipcRenderer.on('record:start', cb),
  onRecordStop: (cb) => ipcRenderer.on('record:stop', cb),
  onStatus: (cb) => ipcRenderer.on('status', (_e, data) => cb(data)),
  submitAudio: (arrayBuffer) => ipcRenderer.invoke('audio:submit', arrayBuffer),
  requestHide: () => ipcRenderer.invoke('indicator:hide'),
  openCorrection: () => ipcRenderer.invoke('correction:open'),
});

contextBridge.exposeInMainWorld('bailingSettings', {
  load: () => ipcRenderer.invoke('settings:load'),
  save: (patch) => ipcRenderer.invoke('settings:save', patch),
  test: (opts) => ipcRenderer.invoke('settings:test', opts),
  kbStatus: () => ipcRenderer.invoke('kb:status'),
  kbReindex: () => ipcRenderer.invoke('kb:reindex'),
  kbPickFolder: () => ipcRenderer.invoke('kb:pickFolder'),
  termsLibrary: () => ipcRenderer.invoke('terms:library'),
  termsSave: (patch) => ipcRenderer.invoke('terms:save', patch),
  termsSuggest: () => ipcRenderer.invoke('terms:suggest'),
  openTermlib: () => ipcRenderer.invoke('termlib:open'),
  correctionLast: () => ipcRenderer.invoke('correction:last'),
  learn: (wrong, right) => ipcRenderer.invoke('terms:learn', { wrong, right }),
  removeCorrection: (wrong) => ipcRenderer.invoke('terms:removeCorrection', wrong),
  onRefresh: (cb) => ipcRenderer.on('refresh', cb),
  winControl: (action) => ipcRenderer.send('win:control', action), // minimize / close（自绘标题栏按钮）
  providerQuota: () => ipcRenderer.invoke('provider:quota'), // 云服务今日额度
  setTrialScene: (scene) => ipcRenderer.send('welcome:trialScene', scene), // 引导页场景试用
  finishWelcome: () => ipcRenderer.send('welcome:done'), // 完成/跳过引导
  onWelcomeResult: (cb) => ipcRenderer.on('welcome:result', (_e, data) => cb(data)), // 试用出字结果
});
