import {Config} from '@remotion/cli/config';
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(95);
Config.setCodec('h264');
Config.setCrf(17);
Config.setPixelFormat('yuv420p');
Config.setAudioCodec('aac');
if (process.env.BROWSER_PATH) Config.setBrowserExecutable(process.env.BROWSER_PATH);
