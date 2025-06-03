# Team Software Principles

While `software_principles.md` is a useful general principles guide and should be followed, this guide aims to refine a few
specific higher-level principles that are of special importance on the team.

---

### 1. Simplify, simplify, simplify

**Explanation:** It is valuable to think about the simplest way to do the job at hand. Don't over-engineer algorithms or UIs and actively
think about simplifying existing solutions.

**Example:** UIs should not be more complex than needed; often less is more. Complex algorithms can be simplified to simpler ones. Do not
add extraneous properties that are unnecessary or default.

**Benefits:** Manages complexity by reducing complexity in the codebase to just the minimum essential complexity needed.

---

### 2. Consistency is valuable in itself

**Explanation:** It is valuable in itself to have consistent code standards and ways of doing things. There can be deviating from a
standard but the reason for exceptions needs to be understood and held consistently. If there is improvement to standards,
we should align on new standards and refactor incrementally.

**Example:** A standard way to define styles, ways to use flexible APIs (e.g., react-query and prisma), how code is layed out
(e.g., where constants, hooks, etc are defined), forms management (react-hook-forms for complex forms and mantine-forms for simple forms)
and database access patterns.

**Benefits:** Increases maintainability of a codebase by decreasing unexpected surprises and cognitive load. It reduces
what it takes to understand the non-essential complexity of a codebase (e.g., patterns, external libraries, etc) so we can
spend more the essential complexity (e.g., business rules, workflows, layouts).

---

### 3. Maximize cohesion and minimize coupling

**Explanation:** This principle can be summarized as: "Keep related things close together and unrelated things further apart."
Apply this at every level of abstraction—functions, modules, components, services, or even distributed systems.

By doing this, you maximize cohesion of your code (e.g., how closely related the responsibility of a unit are).
You also minimize coupling by having more dependent logic be within the boundary of the units and
reducing the coupling of units that are further apart.

**Example:** Split components by domain boundaries (e.g., `UserService`, `InventoryService`, `OrderService`) that
reduces the interaction between the boundaries and maximizes the interactions and cohesion within the component. An anti-example
is splitting components by functional boundaries (e.g., `DatabaseService` that makes all types of DB calls) which are highly coupled with the
external components and not cohesive internally.

**Benefits:** Cohesion makes units easier to reason about and maintain. Minimized coupling makes change easier because
there is each change will have less dependencies that are coupled to it. Code changes are less likely to have propagating
effects on other parts of the code and the propagating effects are also less likely to be further. In addition, when most coupling
is closer together, it is easier to manage because it is easier to test (unit tests are cheap, service-service tests expensive)
and change (it is quick to make changes to a function or file, hard to make changes across services).

---

### 4. Functions and components contain logic that are at the appropriate level of abstraction

**Explanation:** Each function, component, or module should operate at a single, clear level of abstraction.
High-level functions / components should not contain low-level implementation details, and low-level functions
should not contain logic that is a responsibility of a higher-level function or component.

**Example:** A `orderBooks` function might include details of `chooseBook`, `putBookInCart`, `checkoutCart` but should
not contain logic related to database interfacing and stripe client interactions. Those lower-level abstraction items should
be pulled into a separate function. A `BookCard` UI component should not contain logic which determines `Order` it came from,
instead it should have that information passed to it by `OrderedBooksCardList` component.

**Benefits:** This makes code simpler to read and understand. It is cognitively intensive to hop between abstraction levels
and it is easier to read code that works at the same level of abstraction.

---

### 5. Generalize but do not over-generalize

**Explanation:** When you see repetition, generalize—but only when the abstraction is justified. Over-generalizing too early
can lead to unnecessary coupling between functions/components that diverge over time. There are times when you can be sure
something is generalizable, if unsure lean on the rule of three before introducing a generalization.

**Example:** If two components share similar UI logic, extract a custom hook or utility function. However, don’t create
a "universal form handler" before you have multiple forms with shared behavior—start simple and refactor as patterns emerge.

**Benefits:** If done right, this makes it easier to manage shared logic in one place rather than needing to maintain
the same logic and changes across multiple repeated functions / components.

This is a specific subset of rule #3 - by identifying common/coupled logic and moving them closer together in code
(in this case, completely colocated!), changes to the coupled logic is easier to manage.

---

### 6. This is our campfire, pick up the trash

**Explanation:** We are all shared owners the codebase. Whenever we change the code, we should aim to leave the codebase
better than we left it. We should not just prioritize individual speed and features.

**Example:** If you are adding a feature and discover that the code is mis-structured in a way to optimally support the
new addition, make the refactor to do things the right way rather than deferring and adding more tech debt. Code design and
refactoring is a continual process and relies on feedback as it evolves over time. Do not ignore that feedback for short-term
speed but long-term tech debt.

**Benefits:** Codebases inherently degrade over time! It takes an intentional culture and active decisions to fight
this tragedy of the commons!

---

### 7. Test-driven development

**Explanation:** Write tests before implementing features. Use the tests as quick immediate feedback as you implement
the feature, first by confirming the test fails first and then eventually passes as you finish implementation. Where to write
tests depends on where the stable contract points are (else your tests will be too coupled to your changes) and where the complexity is
(e.g., where things are breaking).

**Example:** Property-based tests on the backend test the stable service API and can be implemented before implementing the feature.
On the UI, complex logic can be extracted into a function and tested with a unit test.

**Benefits:** By writing tests before you implement, you are maximizing the benefit you get out of the test as it gives you free
timely feedback during implementation. If you write it after, you miss out on that benefit! In addition, the test is a client
of the component/service you are testing and therefore is a signal on the design. If something is hard to test, it is signal that it
may be improperly designed for other clients. In addition, having high level of tests in general increases confidence in changes
which increases velocity and supports continuous delivery where there are little bottlenecks to go from push -> production.

---

### 8. Work incrementally

**Explanation:** Break your work down into small steps that can separately tested and deployed.

**Example:** Breakdown a complex features into the smallest releasable sub-feature. For example,
a complex role management system might start with just supporting the admin role which can be extended in follow-ups.
Within the deployable unit, it is useful to additionally break out the implementation into subtasks that can be
separately tested.

**Benefits:** The more you break down features into smaller steps, the quicker you can get them in front of points of feedback,
whether that be the feedback of tests, code integrations (does it work with other code being merged in), reviewers, or
the user feedback. This decreases the chance of wasted work (e.g., something that does not
technically work or is misaligned with user expectations). When you work incrementally, you also decrease the surface area of
change which makes it easier to fix or rollback.

---

### 9. Move fast to move safe

**Explanation:** The biggest risk in software is in delaying feedback and big-bang releases. Fast iteration with strong
automated safeguards produces higher-quality systems than slow processes with manual gates.

**Example:** We use trunk-based development to decrease the friction to get from push to deploy. Reviews are used for
long-term alignment but not to gate deployments. This requires and is enforced by the test-driven culture where
we rely on high level of automated test coverage ensure to ensure changes are OK to deploy.

**Benefits:** The biggest lever to code quality and safety is feedback. You get feedback faster when you move faster.
Guardrails like review committees have been shown to *increase* risk as they slow down deployment speed. In addition,
smaller changes are easier to debug and rollback.

---

### 10. In the end, it's all about velocity

Why should we have these principles and standards? Aren't we a start-up?!

Start-ups need to move fast and pivot quickly. When we follow these standards - when we manage the complexity and coupling of
our code, when we care about it being readable and maintainable - we make it easier to onboard onto and faster to change.
Change, onboarding, and context changes are all **more** frequent in a startup than big company so these are all things that 
are more important not less important for a start-up!

By working more iteratively with more points of feedback, we gain more confidence and effectiveness in moving in the right direction
which improves velocity (which is not just speed but also that we are going in the right direction). By caring about the safety and 
reliability of our deployments, we gain more psychological safety in our system. Never underestimate psychological safety 
in the system to an engineer's ability to move fast. When we follow these standards, we also change the composition of our work 
to do more of what we love - building and shipping value-add features for users versus fixing fires or unmangling and maintaining bad code - 
all things that keep us loving our jobs, keeping in flow, and not burning out! These are multipliers for team velocity. 

In the end, because velocity is the north-star, we as a team we should refine and critique our processes and standards against
this top-level goal! It also is the lens for which we can also evaluate pragmatic exceptions (for example, making a decision that trades
short-term velocity to reach a deadline as long as we can mitigate and address the long-term velocity impact with good design and 
planning).