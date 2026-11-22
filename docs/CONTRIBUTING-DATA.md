# Adding places, festivals, food, itineraries and more

Plan My Keralam is a fun, independent project. Anyone can add content with a small `.json` file. There are two ways:

| | **Share with everyone** | **Just for you** |
|---|---|---|
| How | Add the file to this repository with a pull request | Open the site's **Contribute** page and load the file |
| Who sees it | Every visitor, after the site rebuilds | Only you, in this browser on this device |
| Checked | Automatically when the site builds; a broken file stops the build, not the live site | Instantly in your browser; errors show which field is wrong |

The same file works for both.

## Share with everyone (pull request)

1. Copy the example for your type from [`docs/examples/`](examples/).
2. Fill it in. `slug` becomes the file name: lowercase letters, numbers and hyphens, e.g. `kakkayam-dam`.
3. Add it to the matching folder on GitHub ("Add file" → "Create new file"):

| Type | Folder | Example |
|---|---|---|
| Destination | `src/content/destinations/` | [destination.json](examples/destination.json) |
| Festival or event | `src/content/festivals/` | [festival.json](examples/festival.json) |
| Experience | `src/content/experiences/` | [experience.json](examples/experience.json) |
| Itinerary | `src/content/itineraries/` | [itinerary.json](examples/itinerary.json) |
| Hotel, homestay, rental, houseboat | `src/content/stays/` | [stay.json](examples/stay.json) |
| Plan by a well-known traveller | `src/content/traveller-plans/` | [traveller-plan.json](examples/traveller-plan.json) |
| Food guide dish | `src/content/food/` | [food.json](examples/food.json) |

4. Open a pull request. The checks run `npm test` and `npm run build`. If a field is wrong, the message names it.

## Just for you (load in the browser)

Open **Contribute** on the site, choose **Load JSON file**, and pick your file. A file can hold one entry or a list of entries (`[ {...}, {...} ]`). Every entry needs a `"type"` field: `destination`, `festival`, `experience`, `itinerary`, `stay`, `traveller-plan` or `food`.

Imported entries show under **Imported by you** on the matching page, and imported destinations can be picked in the trip planner. They are stored only in this browser: clearing your browser data deletes them. You can delete them on the Contribute page.

## Fields

Fields marked * are required.

**Every type:** `slug`*, `name`*, `author` (your name or GitHub handle), `why` (why visit: recommended), `officialLink`, `streetView`, `images`, `videos`.

**Places** (destination, stay; optional on the others): `summary`*, `lat`* and `lng`* (decimal degrees inside Kerala, e.g. `10.0889`, `77.0595`), `bestMonths`* (numbers 1–12; use all twelve for year-round).

| Type | Extra fields |
|---|---|
| destination | `categories`* (`backwaters`, `beaches`, `hills`, `wildlife`, `waterfalls`, `heritage`), `region`* (`south`, `central`, `north`), `district`*, `days`* (e.g. `"1–2 days"`), `airport`*, `fromKochi`*, `todo`* (list), `base` (nearest planner base: `bekal`, `kannur`, `wayanad`, `kozhikode`, `thrissur`, `kochi`, `munnar`, `thekkady`, `vagamon`, `kumarakom`, `alappuzha`, `varkala`, `kovalam`) |
| festival | `months`* (1–12), `where`*, `note`*, `link` (official page) |
| experience | `icon`*, `text`*, `tips`* (list), `link`* (`{ "href", "label" }`) |
| itinerary | `who`*, `q`* (planner settings, e.g. `days=7&interests=hills`), `days`* (list of `{ "d", "place", "what" }`) |
| stay | `kind`* (`hotel`, `homestay`, `rental`, `houseboat`), `area`*, `priceRange`, `website` |
| food | `kind`* (e.g. `Breakfast`, `Seafood`, `Snack`), `spice`* (0 not spicy – 3 hot), `veg`* (`true`/`false`), `desc`*, `places` (where to try it: list of `{ "name", "area", "mapLink", "website" }`; `mapLink` is a Google Maps or OpenStreetMap link) |
| traveller-plan | `person`* (`name`, `knownFor`, `note`, `works` list, `links` list), `tags`* (e.g. `ayurveda`, `culture`, `trekking`, `food`, `wildlife`, `backwaters`), `stops`* (planner stops, e.g. `"kochi:2,munnar:2"`, using the base names above), `days`*, `consent`*, `fictional` |

## Rules

- **Links:** every URL must start with `https://`.
- **Images:** link to images you took or that have an open licence (e.g. Wikimedia Commons). Fill in `credit` and `license`. Don't copy photos from official or commercial sites.
- **Videos:** YouTube links only. They play through YouTube's privacy-enhanced mode.
- **Street View:** paste a Google Maps link.
- **Facts:** write in your own words. Don't copy text from official websites; link to them instead.
- **Real people:** a traveller plan may name a real person only with their permission. Put the proof (a link or a short statement) in `consent`. Plans without it will be removed.
- **Businesses:** stays are listed as the community adds them. They are not checked or endorsed.
