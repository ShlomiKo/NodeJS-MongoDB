const MongoClient = require("mongodb").MongoClient;
const assert = require("assert");

const circulationRepo = require("./repos/circulationRepo");
const data = require("./circulation.json");

const url = "mongodb://localhost:27017";
const dbName = "circulation";

async function main() {
  const client = new MongoClient(url);
  await client.connect();
  try {
    const results = await circulationRepo.loadData(data);
    assert.equal(data.length, results.insertedCount);

    const getData = await circulationRepo.get();
    assert.equal(data.length, getData.length);

    const filterData = await circulationRepo.get({
      Newspaper: getData[4].Newspaper,
    });
    assert.deepEqual(filterData[0], getData[4]);

    const limitData = await circulationRepo.get({}, 3);
    assert.equal(limitData.length, 3);

    const id = getData[4]._id.toString();
    const byId = await circulationRepo.getById(id);
    assert.deepEqual(byId, getData[4]);

    const newItem = {
      Newspaper: "My Paper",
      "Daily Circulation, 2004": 1,
      "Daily Circulation, 2013": 2,
      "Change in Daily Circulation, 2004-2013": 100,
      "Pulitzer Prize Winners and Finalists, 1990-2003": 0,
      "Pulitzer Prize Winners and Finalists, 2004-2014": 0,
      "Pulitzer Prize Winners and Finalists, 1990-2014": 0,
    };

    const addedItem = await circulationRepo.add(newItem);
    assert(addedItem._id);
    const addedItemQuery = await circulationRepo.getById(addedItem._id);
    assert.deepEqual(addedItemQuery, newItem);

    const updatedItem = await circulationRepo.update(addedItem._id, {
      Newspaper: "My New Paper",
      "Daily Circulation, 2004": 1,
      "Daily Circulation, 2013": 2,
      "Change in Daily Circulation, 2004-2013": 100,
      "Pulitzer Prize Winners and Finalists, 1990-2003": 0,
      "Pulitzer Prize Winners and Finalists, 2004-2014": 0,
      "Pulitzer Prize Winners and Finalists, 1990-2014": 0,
    });
    assert.equal(updatedItem.Newspaper, "My New Paper");

    const newAddedItemQuery = await circulationRepo.getById(addedItem._id);
    assert.equal(newAddedItemQuery.Newspaper, "My New Paper");

    const removed = await circulationRepo.remove(addedItem._id);
    assert(removed);
    const removedItemQuery = await circulationRepo.getById(addedItem._id);
    assert.equal(removedItemQuery, null);

    const avgFinalists = await circulationRepo.averageFinalists();
    console.log("Average Finalists: " + avgFinalists);

    const avgByChange = await circulationRepo.averageFinalistsByChange();
    console.log(avgByChange);

  } catch (error) {
    console.log(error);
  } finally {
    await client.db(dbName).dropDatabase();

    const admin = client.db(dbName).admin();
    //console.log(await admin.serverStatus());
    console.log(await admin.listDatabases());

    client.close();
  }
}

main();
