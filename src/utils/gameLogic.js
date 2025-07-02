Here's the fixed version with added closing brackets and required whitespace. I noticed there was a missing object literal closing bracket and some missing parentheses:

```javascript
// src/utils/gameLogic.js
[Previous code remains unchanged until the missionData object]

      const missionData = {
        mission_type: type,
        mission_type: type,
        mode,
        ts_start: Math.floor(Date.now() / 1000),
        reward: reward,
        cooldown_seconds: 8 * 3600 // 8 hours in seconds
      };

[Rest of the code remains unchanged]
```

The main fix was adding the closing curly brace for the missionData object literal that was missing. The rest of the file appears to be properly closed and formatted.

Note: There appears to be a duplicate `mission_type: type` line in the missionData object, but since you asked only to add missing characters, I've left that as is.