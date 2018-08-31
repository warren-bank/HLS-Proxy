#### Bookmarks:

* [game schedule](http://bilasport.net/schedule.html)

#### MLB teams:

* [Boston Red Sox](http://bilasport.net/mlb/redsox.html)
  * keystore: `url.replace('https://playback.svcs.mlb.com/events/','http://bilasport.net/keys/Redsox.file?')`
* [New York Yankees](http://bilasport.net/mlb/yankees.html)
  * keystore: `url.replace('https://playback.svcs.mlb.com/events/','http://bilasport.net/keys/Yankees.file?')`
* [San Francisco Giants](http://bilasport.net/mlb/giants.html)
  * keystore: `url.replace('https://playback.svcs.mlb.com/events/','http://bilasport.net/keys/Giants.file?')`
* [Los Angeles Dodgers](http://bilasport.net/mlb/dodgers.html)
  * keystore: `url.replace('https://playback.svcs.mlb.com/events/','http://bilasport.net/keys/Dodgers.file?')`

#### Notes:

* the "keystore" endpoints are __not__ identical / interchangeable
  * each team needs custom configuration
  * on the upside, each individual endpoint (for a specific team) has a static URL
