# jeopardy
web based jeopardy from a csv file

CSV formatting information (there is a sample csv in the main folder)

Note: all cells beginning in '//' will be ignored

1. First row: categories. List the categories in order

2. Next x rows: Next rows will be allocated to however many categories were set from the first row. In each row, list all questions then list all answers.

3. Next row: point values. List point values in ascending order for the amount of questions that are in each category

4. Next row: final jeopardy (Optional). In order, question, answer, imageURL, showWith. ImageURL and showWith are optional. showWith possible values: "question", "answer"

5. Remaining rows: images. Each row begins with the category index (0 based), then the question index (0 based). Then, add imageURL and showWith("question"/"answer")(optional, default="question")
