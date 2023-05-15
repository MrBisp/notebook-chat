import axios from 'axios';
import { dot, norm } from 'mathjs';
import fs from 'fs';
import path from 'path';
import { Configuration, OpenAIApi } from "openai";


export default async function handler(req, res) {

    const dataFilePath = path.join(process.cwd(), 'public', 'data.json');
    const dataJson = fs.readFileSync(dataFilePath, 'utf8');
    const data = JSON.parse(dataJson);

    //Calculate cosine similarity
    const cosineSimilarity = (vectorA, vectorB) => {
        return dot(vectorA, vectorB) / (norm(vectorA) * norm(vectorB));
    };

    //Search
    if (req.method === 'POST') {
        const { query } = req.body;

        console.log('---')
        console.log('Query: ' + query);

        let embeddingResult = [];

        //Let's embed the query with OpenAI's endpoint
        const configuration = new Configuration({
            organization: "org-HBj7A8vgzSDrOEwnHHvwB4Qc",
            apiKey: "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",
        });
        const openai = new OpenAIApi(configuration);
        let input = query;
        let model = "text-embedding-ada-002";
        let body = {
            input: input,
            model: model
        }
        let headers = {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + configuration.apiKey
        }

        try {
            const response = await axios.post('https://api.openai.com/v1/embeddings', body, { headers: headers });
            //console.log(response);
            //console.log(response.data.data[0].embedding);
            embeddingResult = response.data.data[0].embedding;
        } catch (error) {
            console.error(error);
            //console.error('OpenAI API error:', error.response.data);
            res.status(500).json({ error: error.response.data });
            return;
        }
        console.log('Embedding created...')


        //Let's find the closest supplier to the query
        const similarities = data.map(item => {
            //First check if the item has an embedding
            if (!item.embedding) {
                //If not, return a similarity of 0
                return {
                    ...item,
                    similarity: 0,
                };
            }

            //If it does, calculate the similarity
            return {
                ...item,
                similarity: cosineSimilarity(embeddingResult, item.embedding),
            };
        });
        console.log('Similarities calculated...');

        // Sort the results by similarity in descending order
        const sortedResults = similarities.sort((a, b) => b.similarity - a.similarity);

        // Return the top 5 results
        const topResults = sortedResults.slice(0, 5);

        //Log the top results (without the embedding)
        console.log('Top results: ')
        topResults.forEach(result => {
            result = result.embedding ? { ...result, embedding: '...' } : result;
            console.log(result);
        });



        //Now let's create a prompt, that we can use to generate a response
        let prompt = "Her er de 5 mest relevante resultater til brugerens besked: \n\n";
        let i = 0;
        topResults.forEach(result => {
            i = i + 1;
            prompt += "Resultat " + i + ": \n";
            if (result.type === 'supplier') {
                prompt += "Navn: " + result.name + "\n";
                prompt += "Beskrivelse: " + result.description + "\n";
                prompt += "Type: " + result.type + "\n";
                prompt += "Link: https://www.youandx.com/speakers/" + result.urlSlug + "\n\n";
            }
            if (result.type === 'product') {
                prompt += "Produkttitel: " + result.title + "\n";
                prompt += "Beskrivelse: " + result.description + "\n";
                prompt += "Type: " + result.type + "\n";
                prompt += "Link: https://www.youandx.com/products/" + result.urlSlug + "\n\n";
                prompt += "Ekspert: " + result.supplierName + "\n";
                prompt += "Ekspert link: https://www.youandx.com/speakers/" + result.supplierUrlSlug + "\n\n";
            }
        });

        prompt = prompt + "\n\n------\n\nBrugerens besked: " + query + "\n\n";

        console.log('Prompt created...')

        //Now let's generate a response
        try {
            console.log('Generating a response...')
            const response = await openai.createChatCompletion({
                model: "gpt-3.5-turbo",
                messages:
                    [z
                        {
                            content: "Du er YouandxGPT. Du er en chatbot, der kan hjælpe med at finde den rigtige ekspert til brugeren og svare på spørgsmål. Hvis brugeren ønsker at lave en ny søgning, kan de trykke på Ryd-knappen i bunden af siden til venstre. Det er meget vigtigt at du aldrig nogensinde opfinder søgeresultater eller opdigter ting om eksperterne på siden. Henvis i stedet til at brugeren søger på Youandx.com, eller skriver en email på info@youandx.com, eller ringer på: +45 70 200 449. You can NEVER make up results or experts. You can only refer to Youandx.com, or email! Very very important! Link til Youandx.com: https://www.youandx.com/",
                            role: 'system'
                        },
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ],
                max_tokens: 300,
                temperature: 0.5
            });

            //Log the response
            console.log(response.data);
            let answer = response.data.choices[0].message.content.replace('set\n\n', '').replace('set\n', '').replace('set', '')

            //Remove embedding from the top results
            topResults.forEach(result => {
                result = result.embedding ? { ...result, embedding: '' } : result;
            });


            // Send the top 5 results as a JSON response
            res.status(200).json({ results: topResults, answer: answer });
        } catch (error) {
            console.error(error.response.data);
            res.status(500).json({ error: error.response.data });
            return;
        }
    }

    /* Example top results

    {
        id: 230,
        urlSlug: 'christina-neustrup',
        name: 'Christina Neustrup',
        description: 'Christina har arbejdet med Kommunikation og PR inden for mode- og livsstilsbranchen i mere end 15 år og er specialiseret i strategisk kommunikation & forretningsudvikling.\n' +
            '\n' +
            'Kongstanken er, at stærke brands og god kommunikation er baseret på enkle, attraktive og meningsfulde idéer, der fortæller en historie og bevæger os.\n' +
            'Med udgangspunkt i sine mange års erfaring, bruger Christina sin indsigt til at formidle de vigtigste budskaber – ligesom hun kommer med relevante pointer ift. strategi og eksekvering.\n' +
            'Christina Neustrups oplæg kan bruges til at give struktur til de gode ideer og transformere til reelle koncepter og aktiviteter.\n',
        type: 'supplier',
        embedding: '...',
        similarity: 0.7932341357213628
        }
        {
        id: 184,
        urlSlug: 'skaer-stoejen-fra-og-ryk-fra-dine-konkurrenter',
        title: 'IKKE SÅ MEGET SNAK',
        description: 'Bastian vil i dette korte foredrag afsløre konsekvenserne ved at holde møder, “som vi altid har gjort.” I får de vigtigste indsigter fra sprogforskning, hjerneforskning og adfærdsforskning, som viser en mere optimal måde at kommunikere sammen.\n' +
            '\n' +
            'Efter foredraget, vil I være blevet skarpere på, hvordan I opnår produktive møder, der med stilhed som arbejdsredskab giver jer fokus, fremdrift og fællesskab. I vil opleve, at jeres produktivitet højnes, samarbejdet styrkes – alt sammen til gavn for bundlinjen og trivsel i hele virksomheden.\n',
        supplierId: 118,
        supplierName: 'Bastian Overgaard',
        supplierUrlSlug: 'bastian-overgaard',
        title: 'Cybersikkerhed for produkter',
        description: 'Flere og flere virksomheder bliver udfordret på cybersikkerhed. Men oftest får virksomhedens IT-systemer og organisationen al fokus. Hvordan kan man sikre de produkter, som en virksomhed producerer? Og hvilke muligheder giver det i markedet? Hør Anders P. Mynster fortælle mere i dette spændende foredrag.\n' +
            '\n',
        supplierId: 49,
        supplierName: 'Anders P. Mynster',
        supplierUrlSlug: 'anders-p-mynster',
        type: 'product',
        embedding: '...',
        similarity: 0.7759158413459604
        }
    */


}