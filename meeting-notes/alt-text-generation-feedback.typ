= Alt Text Generation

Almost all images on The Reporting Project website have
captions adding contextual information. However, alt text
is still necessary, as it describes the what of each
image, not extra context such as why something is
happening. When crafting a prompt and adjusting the alt
text, the goal was to keep it a short terse description of
what is in an image. Additionally, the caption of each
image will be fed into the prompt to avoid repeating
information.

Alt text was generated locally on the beefy Denison
machines using a model called "qwen3-vl-30b".

I would like your feedback on the alt text generated from
the images of this Reporting Project article:
https://www.thereportingproject.org/java-joy-beverage-trailer-brings-coffee-tea-and-boba-drinks-to-central-ohio-events/.

== Feedback On Alt Text

For reference, I used the following prompt:

"Create a terse one sentence description describing WHAT
is in this image without extraneous info. Avoid repeating
information in the caption: \<caption would go here\>".

#line(length: 100%)

#image("./Java-Joy-2-1200x1275.jpg", width: 50%)

The caption was: "A colorful selection of drinks from the
Java Joy menu."


The generated alt text: "Three hands hold Java Joy iced beverages, including two green drinks with straws and one coffee."

#box[
  #image("./Java-Joy-1-1024x793.jpg", width: 50%)

  The caption was: "Priya and Hem Pokhrel launched their
  Java Joy trailer in July. Both work other jobs, and Hem,
  who enjoys serving customers in both of his jobs, has a
  dream of one day owning his own store."
 
  The generated alt text: "Two people stand in front of a black Java Joy coffee food truck with a menu board displayed nearby."
]

#box[
  #image("./Java-Joy-3-768x680.jpg", width: 50%)

  The caption was: "Tropical Breeze is one of the most
  popular drinks on the Java Joy “brew & bubbly” menu."

  The generated alt text: "Java Joy's orange menu board lists drinks like Latte Cappuccino, Frozen Caramel Mocha, and Lotus Energy, with two green beverages in front."
]
