import cv2, json, sys, mediapipe as mp
from mediapipe.tasks import python as mpp
from mediapipe.tasks.python import vision
S=sys.argv[1]
opt=vision.HandLandmarkerOptions(base_options=mpp.BaseOptions(model_asset_path=S+'/models/hand_landmarker.task'),
    running_mode=vision.RunningMode.VIDEO,num_hands=2,min_hand_detection_confidence=0.3,min_hand_presence_confidence=0.3,min_tracking_confidence=0.3)
det=vision.HandLandmarker.create_from_options(opt)
cap=cv2.VideoCapture(S+'/src/all1080.mp4'); out=[]; i=0
while True:
    ok,f=cap.read()
    if not ok: break
    r=det.detect_for_video(mp.Image(image_format=mp.ImageFormat.SRGB,data=cv2.cvtColor(f,cv2.COLOR_BGR2RGB)),int(i*40))
    hands=[]
    for lm,hd in zip(r.hand_landmarks,r.handedness):
        hands.append({'label':hd[0].category_name,'score':hd[0].score,'pts':[[round(p.x*1920,1),round(p.y*1080,1),round(p.z,4)] for p in lm]})
    out.append(hands); i+=1
json.dump(out,open(S+'/track.json','w'))
print(i, sum(1 for h in out if h), sum(len(h) for h in out))
