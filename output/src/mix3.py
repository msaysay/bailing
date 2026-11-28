import subprocess, sys
S=sys.argv[1]
ev=[('hum',1.0,.45),('blip',2.8,.6),('blip',3.12,.6),('blip',3.44,.6),('open',3.85,.9),('open',4.25,.7),('whoosh',5.0,.8),('impact',5.4,.55),('open',6.12,.8),('blip',7.32,.7),('whoosh',8.9,.6),('impact',9.32,.4),
('open',10.56,.8),('open',12.44,.8),('blip',13.44,.7),('charge',15.4,.8),('whoosh',16.3,.9),('impact',17.2,.9),('impact',18.48,.4),
('open',20.5,.8),('open',21.2,.6),('blip',21.6,.6),('charge',22.4,.5),('whoosh',23.85,.9),('impact',24.0,.5),
('blip',24.48,.7),('blip',24.96,.7),('blip',25.44,.7),('blip',25.92,.7),('blip',26.4,.6),('open',26.8,.9),('whoosh',28.15,.9),
('zap',29.16,.8),('charge',29.8,.8),('impact',30.6,1.0),('zap',5.9,.3),('zap',13.1,.3),('zap',19.1,.3),('zap',26.3,.3),('blip',9.5,.5),('open',10.5,.5),('blip',13.7,.5),('blip',14.1,.5),('blip',14.55,.5),('blip',15.0,.5),('blip',1.8,.5),('blip',2.2,.5),('blip',2.65,.5),('charge',24.3,.5)]
cmd=['ffmpeg','-v','error','-y','-i',S+'/fx3_video.mp4','-i',S+'/src/all1080.mp4']
fl=[]; 
for i,(n,t,v) in enumerate(ev):
    cmd+=['-i',S+'/sfx/%s.mp3'%n]
    fl.append('[%d:a]aresample=48000,aformat=channel_layouts=stereo,volume=%.2f,adelay=%d:all=1[a%d]'%(i+2,v,int(t*1000),i))
fl.append('[1:a]aresample=48000,aformat=channel_layouts=stereo[o]')
fl.append('[o]'+''.join('[a%d]'%i for i in range(len(ev)))+'amix=inputs=%d:normalize=0:duration=first,alimiter=limit=0.9[m]'%(len(ev)+1))
cmd+=['-filter_complex',';'.join(fl),'-map','0:v','-map','[m]','-c:v','copy','-c:a','aac','-b:a','192k','-shortest','-movflags','+faststart',sys.argv[2]]
subprocess.check_call(cmd)
