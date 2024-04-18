import Router from "koa-router";
import getQueueEstimatedWaitingTime from "./queueAPI";

export const router = new Router();

router.get("/ping", async (ctx, next) => {
	ctx.body = 'pong';
});
  
router.get("/queue", async (ctx, next) => {
  const queue = await getQueueEstimatedWaitingTime();
	
  ctx.body = queue;
});
