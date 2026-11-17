export const entity = (name: string) => `how-to-make-a-presentation:${name}`
// Coordinates never change between beats: the explanation accumulates in place.
export const nodes = [
  {name:'you',at:1,x:62,y:62,w:115,h:68,text:'you',kind:'person'},
  {name:'prompt',at:1,x:64,y:24,w:180,h:28,text:'“I have a topic…”',kind:'prompt'},
  {name:'skill',at:2,x:600,y:62,w:150,h:68,text:'the skill',kind:'person'},
  {name:'question',at:2,x:310,y:38,w:210,h:28,text:'one question at a time',kind:'question'},
  {name:'tray',at:3,x:48,y:196,w:780,h:118,text:'YOUR STORY / A SCENE IN THE MAKING',kind:'tray'},
  {name:'card-1',at:3,x:76,y:218,w:137,h:78,text:'01 · the idea',kind:'card'},
  {name:'card-2',at:4,x:270,y:218,w:137,h:78,text:'02 · the story',kind:'card'},
  {name:'card-3',at:4,x:464,y:218,w:137,h:78,text:'03 · the scene',kind:'card'},
  {name:'ghost',at:5,x:628,y:218,w:54,h:78,text:'…',kind:'ghost'},
  {name:'depth',at:5,x:65,y:132,w:180,h:26,text:'you choose: partial ↔ full',kind:'depth'},
  {name:'scene-kit',at:6,x:288,y:314,w:274,h:30,text:'shared scene kit · shapes + motion',kind:'socket'},
  {name:'verify',at:7,x:708,y:218,w:102,h:78,text:'✓ verified',kind:'verify'},
  {name:'modify',at:8,x:286,y:160,w:276,h:24,text:'↶ ask for a change · edit in place',kind:'modify'},
  {name:'reveal',at:9,x:14,y:5,w:850,h:365,text:'THIS PRESENTATION IS THE EXAMPLE',kind:'reveal'},
] as const
