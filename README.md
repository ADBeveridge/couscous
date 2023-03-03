# Charity Organizational Tool
Track donations made to your organization and when to notify donors to donate.

## Code Organization
Code that only Susers (which are super-users) can execute are in the [suser.js](https://github.com/ngrambev/cot/blob/main/src/suser.js) file. The actions that only Owners (the people who run the whole product) can execute are in the [owner.js](https://github.com/ngrambev/cot/blob/main/src/owner.js) file. And since Susers can do everything that Lusers (the lowest tier) can do, the file that has the permissions shared are in the [luser_suser.js](https://github.com/ngrambev/cot/blob/main/src/luser_suser.js) file.

Everytime that a url a requested, the check function is called, which makes sure that the request is valid. There is a different check function for each tier, as certain tiers can only access certain urls. If they are not logged they are sent the [login.html](https://github.com/ngrambev/cot/blob/main/src/login.html) page, which POSTS them the the [authentication code](https://github.com/ngrambev/cot/blob/main/src/index.js#L101). 
