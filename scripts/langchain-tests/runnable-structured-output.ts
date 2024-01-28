import { createStructuredOutputRunnable } from 'langchain/chains/openai_functions';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { JsonOutputFunctionsParser } from 'langchain/output_parsers';
import { chatModel as model } from './common';

const jsonSchema = {
  title: 'Person',
  description: 'Identifying information about a person.',
  type: 'object',
  properties: {
    name: { title: 'Name', description: "The person's name", type: 'string' },
    age: { title: 'Age', description: "The person's age", type: 'integer' },
    fav_food: {
      title: 'Fav Food',
      description: "The person's favorite food",
      type: 'string',
    },
    nationality: {
      title: 'Nationality',
      description: "Will be inferred from the person's name",
      type: 'string',
    },
  },
  required: ['name', 'age', 'fav_food', 'nationality'],
};

const prompt = ChatPromptTemplate.fromMessages([
  ['human', 'Human description: {description}'],
]);

const outputParser = new JsonOutputFunctionsParser();

// Also works with Zod schema
const runnable = createStructuredOutputRunnable({
  outputSchema: jsonSchema,
  llm: model,
  prompt,
  outputParser,
});

const response = await runnable.invoke({
  description:
    // "My name's John Doe and I'm 30 years old. My favorite kind of food are chocolate chip cookies.",
    "Me llamo Juan Perez y tengo 30 años. Me encanta la cerveza y los Takis.",
});

console.log(response);

// { name: 'John Doe', age: 30, fav_food: 'chocolate chip cookies' }
