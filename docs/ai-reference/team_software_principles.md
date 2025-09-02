# Team Software Principles

### 1. Simplify, simplify, simplify

**Explanation:** Always look for the simplest solution. Avoid over-engineering.

**Example:** Don't add unnecessary fields. Choose simple algorithms over complex ones when they do the job.

**Benefits:** Less complexity = easier to understand and maintain.

---

### 2. Consistency is valuable in itself

**Explanation:** Follow team standards consistently. Exceptions should be intentional and justified. Improvements to
standards are encouraged!

**Example:** Use the same patterns for styling, database access, and form handling across the codebase.

**Benefits:** Consistent code is easier to understand and work with. New team members can get up to speed faster.

---

### 3. Keep related things together, unrelated things apart

**Explanation:** Group code by what it does, not how it does it. Maximize cohesion, minimize coupling.

**Example:** Create services like `UserService` and `OrderService` (good) rather than `DatabaseService` that handles all database calls (bad).

**Benefits:** Changes stay localized. When you modify one feature, you're less likely to break something unrelated.

---

### 4. Match abstraction levels

**Explanation:** High-level functions should orchestrate, not implement details. Low-level functions should handle specifics, not higher level orchestration.

**Example:** An `orderBooks()` function should call `chooseBook()` and `checkoutCart()`, not contain SQL queries or payment processing details.

**Benefits:** Code is easier to read when you don't have to mentally jump between levels of multiple abstraction - big-picture logic and implementation details.

---

### 5. Generalize wisely

**Explanation:** Extract common patterns, but wait until you see real repetition (rule of three). Don't predict the future.

**Example:** If three forms share similar logic, create a shared hook. But don't build a "universal form system" for just two forms.

**Benefits:** Good abstractions reduce duplication. Bad abstractions create unnecessary coupling and complexity.

---

### 6. The campfire principle. Leave code better than you found it!

**Explanation:** We all own this codebase. When you touch code, seek to leave it in a better state than you found it!

**Example:** If adding a feature reveals structural problems, fix them now rather than adding more technical debt.

**Benefits:** Codebases naturally decay. Without active maintenance, they become unmaintainable.

---

### 7. Write tests first

**Explanation:** Create tests before implementing features. Watch them fail, then make them pass.

**Example:** Write API tests before building the endpoint. Extract complex UI logic into testable functions.

**Benefits:** Tests give immediate feedback during development. If something is hard to test, it's probably poorly designed.

---

### 8. Work in small steps

**Explanation:** Break features into the smallest deployable pieces.

**Example:** Building role management? Start with just admin roles, then add other roles in follow-ups.

**Benefits:** Small changes = faster feedback, easier debugging, simpler rollbacks.

---

### 9. Move fast to move safe

**Explanation:** Quick iteration with automated safeguards beats slow processes with manual gates.

**Example:** We deploy from trunk with automated tests, not review committees. Reviews help with alignment but don't block deployment.

**Benefits:** Fast feedback loops catch problems sooner. Small, frequent changes are safer than big releases.

---

### 10. Velocity is the goal

**Explanation:** Everything we do should help us move faster in the long run. Startups need to pivot quickly, and clean code enables that.

**Example:** These practices aren't overhead—they're investments. We spend more time building features and less time fighting fires. New team members onboard faster. We deploy with confidence.

**Benefits:** When we follow these principles, we maintain sustainable speed. We can evaluate pragmatic exceptions against this goal, balancing short-term deadlines with long-term maintainability.