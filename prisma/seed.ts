import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

async function seed() {
  const kody = await db.user.create({
    data: {
      username: "kody",
      email: "kody@example.com",
      firstName: "Kody",
      lastName: "Smith",
      password: "$2b$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0lSsvqNu/1u", // this is a hashed version of "twixrox"
    },
  });
  await Promise.all(
    getJokes().map((joke) => {
      const data = { jokesterId: kody.id, ...joke };
      return db.joke.create({ data });
    })
  );
  await Promise.all(
    getProjects().map((project) => {
      const data = { userId: kody.id, ...project };
      return db.project.create({ data });
    })
  );
}

seed();

function getProjects() {
  return [
    {
      name: "Remix Run",
      code: "REMIX-RUN",
      locales: "vi,en",
      domain: "remix-run.localhost",
    },
    {
      name: "Remix Demo",
      code: "REMIX-DEMO",
      locales: "en",
      domain: "remix-demo.localhost",
    },
    {
      name: "Remix Test",
      code: "REMIX-TEST",
      locales: "en",
      domain: "remix-test.localhost",
    },
  ];
}
function getJokes() {
  // shout-out to https://icanhazdadjoke.com/

  return [
    {
      name: "Road worker",
      content: `I never wanted to believe that my Dad was stealing from his job as a road worker. But when I got home, all the signs were there.`,
    },
    {
      name: "Frisbee",
      content: `I was wondering why the frisbee was getting bigger, then it hit me.`,
    },
    {
      name: "Trees",
      content: `Why do trees seem suspicious on sunny days? Dunno, they're just a bit shady.`,
    },
    {
      name: "Skeletons",
      content: `Why don't skeletons ride roller coasters? They don't have the stomach for it.`,
    },
    {
      name: "Hippos",
      content: `Why don't you find hippopotamuses hiding in trees? They're really good at it.`,
    },
    {
      name: "Dinner",
      content: `What did one plate say to the other plate? Dinner is on me!`,
    },
    {
      name: "Elevator",
      content: `My first time using an elevator was an uplifting experience. The second time let me down.`,
    },
  ];
}