import { loadPeople } from "./people";
import { loadShows } from "./shows";

const people = await loadPeople();
people.map((person) => console.log(person));
// sync to Turso

const {shows, showHosts} = await loadShows();
shows.map((show) => console.log(show));
showHosts.map((showHost) => console.log(showHost));
// // sync to Turso
