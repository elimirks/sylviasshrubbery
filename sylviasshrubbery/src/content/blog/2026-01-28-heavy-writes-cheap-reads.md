---
title: "Heavy Writes, Cheap Reads"
description: "Keeping I/O bandwidth in mind when dealing with reads and writes"
pubDate: 2026-01-28T13:22:22-03:00
heroImage: "../../assets/blog-placeholder-2.jpg"
---

## Background

One of the things I've learned is challenging over the years is where to put computations or data in your data structure heirarchies, call stacks, or OOP graphs (if you're into that, yuck).

I'm working on adding a single `Option<f64>` value to the result of a query for an API. Ideally, it would be returned in a single bulk query. So think of the structure like:

```rust
struct Foo {
    blah: String,
    blip: Option<f64>, // value I want to add
}
```

Right now, I can use a single query to get a `Vec<Foo>`. That's pretty good for me. The DB does a bit of work of course, but that's pretty self contained in terms of how many network calls it needs to make. In general, these queries just need to hit at most two nodes in the DB cluster. So there are two containers in my VPC sifting through a bunch of data on disks or in memory if it's been cached. Not so bad.

.. but the plot thickens, like clam chowder on a cold stove. Where the computations were placed initially to get `blip`, I would need to use 6 JOINs or so and multiple _serialized_ DB queries. In other words, if I wanted to get `blip` in a single DB query, it would be impossible. I would have to iterate over all the `Foo` structures to calculate the `blip`, which will be in the **hundreds to THOUSANDS**. Currently, our frontend will make all those as separate API requests.

This is putting _heavy heavy heavy_ load on the read end of the data flow! So the user on the frontend has to wait a while. But it had a _cheap_ query on the write end of the flow, which was a less frequent event. It would only happen several hundred times per second or so, and those were people waiting for a form submission anyways, so if you added 100ms or something to their form submission response, it really isn't a big deal.

So to illustrate, as it is now:

## Read end requests
The reader needs to query this 500 to 5000 times from their device.
```rust
/// GET /foos/:bar_id/:foo_id
async fn get_foo(
    bar_id: BarId,
    foo_id: FooId,
) -> Result<Foo, HttpStatusCode> {
    db::get_foo(foo_id).await
}

/// GET /foos/:bar_id/:foo_id/blip
async fn get_blip(
    bar_id: BarId,
    foo_id: FooId,
) -> Result<Option<f64>, HttpStatusCode> {
    // Do a ton of work to get the `blip` value, called hundreds of times
}
```

Ideally I could return a `Vec<Foo>` here in a single network request. But that's how it is now for some reason.

And `get_blip` gets called thousands of times... why.

## Write end requests

Corporations using Searchless are basically trying to find the best applications such that they will get a good fit to the role in maybe... 10-100 total interviews with actual humans? The exact number depends on the corporation's hiring practices. For example, some will do bulk parallel interviewing in a single day, but the process of going from an actual human trying to find a job to the corporation speaking with them is probably in the weeks at least.

### Tangentianl story
TL; DR: I waited 7 months for a response from a job application once.

When I applied to Amazon Alexa while I was in uni, I assumed I was rejected because I had waited probably 4 months with an offer in hand from a different company, plus another 4 months or so of working at the other company. But then they contacted me and I'm like uh.. let's interview after New Years, I want to at least wrap stuff up with my current employer's projects. It was a pretty nice work environment, but the alure of working on HCI and other cool tech drew me in (plus the extra coin). I took some time to learn from people at my first job and actually get something more substantial done. I'm glad I stayed for a bit longer, it was great meeting people there #DndClub. I also had time to read up on tech that I didn't understand like... data structures and algorithms, which at the time was pretty essential for big tech interviews. I did a double major in Physics and CS so I didn't take the more advanced DSA course, which if you understand you can nail programming interviews pretty much anywhere with a couple months of leetcode grinding.

### Back to Write end requests!

Users on the write end are making one request to our API through a form submission.

So the users will have to wait for the network connections between:
1. Their device to AWS in a local region. On a fast network, that's maybe 100ms for job candidates
2. AWS to the some data on a DB disk or memory, probably going to be pretty cheap. Another couple hundred ms at most to return the query results.
3. ditto, in case the data is on a different DB disk which will be in the same AWS region. Cheap cheap cheap

For me at least, if I wait a second for something on the computer I'm not really annoyed if I don't need to do it often. How often do you do an interview? Waiting an extra second for a form submission is trivial when you take even 10 seconds to click the "auto-fill" button if applicable, or minutes if the users have to type out the form.

Even if they have a bad connection it should only take a couple seconds at most I reckon. In my scenario I don't need to worry about that too much because where our data is stored is distributed where we have regional APIs and data.

```rust
/// POST /foos/:bar_id
/// Returns NO_CONTENT (status 204)
async fn post_foo(
    bar_id: BarId,
    foo: Foo,
) -> Result<(), HttpStatusCode> {
    db::write_foo(bar_id, foo).await?; // More or less
    Ok(())
}
```

## The problem
The GET request requires 500 to 5000 network calls from the user's browser. Whenever you need some big N number of network calls, that's a boat load of work! Really, you want a really teensy tiny N number of branching calls for every API call. Obviously, there's a massive performance problem on the read end.

## Massaging the code

I decided to change the location of computation such that the code would be written as follows. Notably, the `post_foo` form submission will take a bit longer, but 100ms is nothing to cry about here.

```rust
// From a DB serialization
struct Bar {
    bar_id: BarId,
    foos: Vec<Foo>,
}

/// GET /foos/:bar_id
async fn get_foo(
    bar_id: BarId,
) -> Result<Vec<Foo>, HttpStatusCode> {
    let foos = db::get_foos_from_bar(bar_id).await?;
    Ok(foos)
}

/// POST /foos/:bar_id
/// Returns NO_CONTENT (status 204)
async fn post_foo(
    bar_id: BarId,
    foo: Foo,
) -> Result<(), HttpStatusCode> {
    // remember, I want `blip` at this point. I already have `Foo`, since I'm
    // creating it, so I just calculate blip here.
    let (blah, blip) = try_join!(
        some_api_to_get_blah(&foo),
        calculate_blip_from_foo(&foo),
    )?;
    let foo = Foo { blip, blah };
    db::write_foo(bar_id, foo).await?;
}
```

In general, I find that it's best to put heavy work on the write end of your data flow. Another great example is read/write locks. One scenario where you want cheap writes would be logging. I would much rather have the cheapest possible log writes, even if it takes a while to read - since it's just devs grepping through logs anyways, and we can 

## Conclusion

So for both the GET and POST, they now both make a couple hundred network requests at most. I'd be surprised if it's over 200 for the few parellelized requests in the POST call, and I'd expect the GET to be under a hundred hops. Initially, the GET request would be invoked 500 to 5000 times whenever a user entered a certain page. Insane.

Looking back, I suspsect the initial kludge was done because it was the simplest path to finish the task. I only noticed this problem when I was working on a separate task and noticed hundreds of API calls being made from the frontend. The initial implementation focused on a cheap writes and heavy reads - exactly what we don't want in this case.
