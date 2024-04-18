import dayjs from "dayjs";
import prisma from "../prisma/prismaClient";
import isSameOrBefore from'dayjs/plugin/isSameOrBefore'
dayjs.extend(isSameOrBefore)

async function getQueueEstimatedWaitingTime() {
  const estimatedTimePerBarber = 30;
	const currentTime = dayjs(`${dayjs(new Date).format('YYYY-MM-DD')} 8:00 am`)

  const barbers = await prisma.barber.findMany({
    where: { customerId: { equals: null } },
    orderBy: { timeIn: "asc" },
  });
  const customers: any = await prisma.customer.findMany({
    where: { deleted_at: { equals: null } },
    orderBy: { id: "asc" },
  });

  let availableBarbers = barbers.filter(
    (barber) =>
      !barber.customerId && dayjs(`${dayjs(new Date).format('YYYY-MM-DD')} ${barber.timeIn}`).isSameOrBefore(currentTime)
  );
  const queue: any = availableBarbers.map((_, i) => ({
    ...customers[i],
    estimatedWaitingTime: 0,
  }));

  for (let i = 0; queue.length < customers.length; i++) {
    const futureAvailableBarbers = barbers.filter((barber) =>
      dayjs(`${dayjs(new Date).format('YYYY-MM-DD')} ${barber.timeIn}`).isSameOrBefore(
        dayjs(currentTime).add(i * estimatedTimePerBarber, "minute")
      )
    );

    for(let j = 0; j < futureAvailableBarbers.length; j++){
			if(queue.length >= customers.length) break
      queue.push({
        ...customers[queue.length],
        estimatedWaitingTime: (i + 1) * estimatedTimePerBarber,
      });
    };
  }

  return queue;
}

export default getQueueEstimatedWaitingTime;
