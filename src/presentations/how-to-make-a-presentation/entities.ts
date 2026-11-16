export const entity = (name: string) => `how-to:${name}`
export interface DiagramEntity { id: string; x: number; y: number; w: number; h: number; text: string; kind: string }
const item = (id: string, x: number, y: number, w: number, h: number, text: string, kind = 'box'): DiagramEntity => ({ id: entity(id), x, y, w, h, text, kind })
export function sceneState(beat: number): DiagramEntity[] {
  const entities = [item('you',80,76,130,58,'you'), item('prompt',80,30,170,30,'I have a topic.', 'prompt')]
  if (beat >= 2) entities.push(item('skill',574,76,150,58,'the skill'),item('conversation',235,92,314,26,'↔','arrow'),item('question',320,52,152,24,'one question at a time','chip'))
  if (beat >= 3) entities.push(item('tray',76,298,770,2,'','tray'),item('card-1',80,206,130,88,'01','card'))
  if (beat >= 4) entities.push(item('card-2',246,206,130,88,'02','card'),item('card-3',412,206,130,88,'03','card'),item('link-1',212,232,32,35,'morphs →','link'),item('link-2',378,232,32,35,'morphs →','link'))
  if (beat >= 5) entities.push(item('ghost',578,206,130,88,'…','ghost'),item('depth',80,138,156,26,'partial ↔ full','chip'))
  if (beat >= 6) entities.push(item('kit',324,300,212,38,'＋ shared scene kit','socket'))
  if (beat >= 7) entities.push(item('verify',744,206,100,88,'verify','verify'),item('link-3',710,232,32,35,'→','link'))
  if (beat >= 8) entities.push(item('modify',280,159,355,40,'edit in place ↶','modify'))
  if (beat >= 9) entities.push(item('reveal',28,16,832,344,'THIS IS THE OUTPUT.','frame'))
  return entities
}
