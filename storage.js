const memory=new Map();
export const storage={
  getItem(key){try{return window.localStorage.getItem(key)??memory.get(key)??null;}catch{return memory.get(key)??null;}},
  setItem(key,value){memory.set(key,String(value));try{window.localStorage.setItem(key,String(value));}catch{}},
};
