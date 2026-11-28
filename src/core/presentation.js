export const PRESENTATION_KEY="shapeweaver.presentation.v1";
/** Optional local preferences. Sound is silent until deliberately enabled.
 * A blocked school-browser storage policy must not break gameplay. */
export function createPresentationPreferences(view){
 let sound=false,reduced=false,storage=null;
 try{
  storage=view?.localStorage??null;
  const value=JSON.parse(storage?.getItem(PRESENTATION_KEY)??"null");
  if(value?.version===1){sound=value.sound===true;reduced=value.reduced===true;}
 }catch{}
 function save(){try{storage?.setItem(PRESENTATION_KEY,JSON.stringify({version:1,sound,reduced}));}catch{}}
 return {get sound(){return sound;},get reduced(){return reduced;},
  get reduceMotion(){return reduced||Boolean(view?.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches);},
  setSound(value){sound=Boolean(value);save();return sound;},
  setReduced(value){reduced=Boolean(value);save();return reduced;}};
}
