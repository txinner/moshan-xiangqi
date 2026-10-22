import {handleRoomRequest} from '../server/rooms.js';
export default {async fetch(request,env){
  if(new URL(request.url).pathname.startsWith('/api/'))return handleRoomRequest(request,env.DB);
  return env.ASSETS.fetch(request);
}};
