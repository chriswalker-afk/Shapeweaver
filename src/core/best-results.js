/** Versioned, local-only best scores. Storage access can fail in private/school browsers. */
export const BEST_RESULTS_KEY="shapeweaver.best-results.v1";
const valid=v=>v&&Number.isSafeInteger(v.moves)&&v.moves>=0&&Number.isInteger(v.stars)&&v.stars>=1&&v.stars<=3;
export function createBestResults(view){
  const best=new Map();
  let storage=null,persisted=false;
  try{
    storage=view?.localStorage??null;
    const raw=storage?.getItem(BEST_RESULTS_KEY);
    if(raw){
      const parsed=JSON.parse(raw);
      if(parsed?.version===1&&parsed.levels&&typeof parsed.levels==="object"&&!Array.isArray(parsed.levels)){
        for(const [id,v] of Object.entries(parsed.levels))if(valid(v))best.set(id,{moves:v.moves,stars:v.stars});
      }
    }
    persisted=Boolean(storage);
  }catch{persisted=false;}
  function get(id){const value=best.get(id);return value?{...value}:null;}
  function record(result){
    if(!result||typeof result.levelId!=="string"||!valid(result))return null;
    const previous=get(result.levelId);
    const next={moves:Math.min(previous?.moves??Infinity,result.moves),stars:Math.max(previous?.stars??0,result.stars)};
    const improved=!previous||next.moves<previous.moves||next.stars>previous.stars;
    best.set(result.levelId,next);
    try{
      if(storage){storage.setItem(BEST_RESULTS_KEY,JSON.stringify({version:1,levels:Object.fromEntries(best)}));persisted=true;}
    }catch{persisted=false;}
    return {best:{...next},improved,persisted};
  }
  return {get,record,get persisted(){return persisted;}};
}
