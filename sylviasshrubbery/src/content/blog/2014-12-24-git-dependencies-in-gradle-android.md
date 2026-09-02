---
title: Git Dependencies in Gradle
description: Git Dependencies in Gradle
pubDate: "Dec 24 2014"
heroImage: "../../assets/blog-placeholder-3.jpg"
---

I found it a pain to get git dependencies working in Gradle, so I decided to write this ugly blog post for my future self and possibly some other desperately-searching Android developers.

**The problem:**

Including git project dependencies (e.g. a common library among your apps).

**The solution:**

Add this to your **root** build.gradle:

```gradle    
import org.ajoberstar.grgit.*

buildscript {
	// ...
	dependencies {
		// ...
		classpath 'org.ajoberstar:gradle-git:0.13.+'
		// ...
	}
	// ...
}

// ...

// At the end of the file (clone it down if it hasn't been done already)

def clonepath = file('build/librarypath')
if (!clonepath.exists()) {
	Grgit.clone(
		dir: clonepath,
		uri: 'ssh://git@domain.com/project/name.git')
}
```




To your **root** settings.gradle:

```gradle   
// ...
include 'Project:SubProject'
project(':Project:SubProject').projectDir = new File(settingsDir, 'build/librarypath/app')
```




To your **app** build.gradle:


```gradle
// ...
dependencies {
	// ...
	compile project(path: ':Project:SubProject')
	// ...
}
// ...
```




And that is it!!

To update the library, you can just go to the root build/library/ and run a git pull.

Thanks goes to:

ajoberstar for suggesting the Grgit.clone method (http://stackoverflow.com/questions/13719676/gradle-how-to-clone-a-git-repo-in-a-task)

athor for explaining how to neatly include projects in settings.gradle (http://stackoverflow.com/questions/25186187/gradle-module-and-git-submodule)


