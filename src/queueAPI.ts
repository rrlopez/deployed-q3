import dayjs from "dayjs";
import prisma from "../prisma/prismaClient";
import isSameOrBefore from'dayjs/plugin/isSameOrBefore'
dayjs.extend(isSameOrBefore)

const estimatedTimePerBarber = 30;
//variable to set current time, initially set to 8:00am
const currentTime = dayjs(`${dayjs(new Date).format('YYYY-MM-DD')} 8:00 am`)

async function getQueueEstimatedWaitingTime() {

  //get all barbers from db
  const barbers = await prisma.barber.findMany({
    where: { customerId: { equals: null } },
    orderBy: { timeIn: "asc" },
  });
  
  //get all customers from db
  const customers: any = await prisma.customer.findMany({
    where: { deleted_at: { equals: null } },
    orderBy: { id: "asc" },
  });

  //filter out barbers without current customer and is already timeIn
  let availableBarbers = barbers.filter(
    (barber) =>
      !barber.customerId && dayjs(`${dayjs(new Date).format('YYYY-MM-DD')} ${barber.timeIn}`).isSameOrBefore(currentTime)
  );

  //initialize queue by adding next in line customer based on the number of currently available barbers
  const queue: any = availableBarbers.map((_, i) => ({
    ...customers[i],
    estimatedWaitingTime: 0,
  }));


  //a loop for simulating future assignment of customer per barber to calculate estimatedWaiting time
  for (let i = 0; queue.length < customers.length; i++) {
    //get all future available Barbers that is already timed In
    const futureAvailableBarbers = barbers.filter((barber) =>
      dayjs(`${dayjs(new Date).format('YYYY-MM-DD')} ${barber.timeIn}`).isSameOrBefore(
        dayjs(currentTime).add(i * estimatedTimePerBarber, "minute")
      )
    );

    //loop all future available barbers until all customers have estimatedTimePerBarber
    for(let j = 0; j < futureAvailableBarbers.length; j++){

      //if the queue length is equal to total customers means all customers is already has an estimatedWaitingTime and no need to continue to see futureAvailableBarbers
			if(queue.length >= customers.length) break

      //add next in line customer to the queue and assign estimatedWaitingTime
      queue.push({
        ...customers[queue.length],
        estimatedWaitingTime: (i + 1) * estimatedTimePerBarber,
      });
    };
  }

  return queue;
}

export default getQueueEstimatedWaitingTime;
