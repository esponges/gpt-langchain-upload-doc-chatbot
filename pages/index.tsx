import { useRef, useState, useEffect, type ChangeEvent } from 'react';
import Layout from '@/components/layout';
import styles from '@/styles/Home.module.css';
import { Message } from '@/types/chat';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import LoadingDots from '@/components/ui/LoadingDots';
import { Document } from 'langchain/document';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { getErrorMessage } from '@/utils/misc';

export default function Home() {
  const [query, setQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [messageState, setMessageState] = useState<{
    messages: Message[];
    pending?: string;
    history: [string, string][];
    pendingSourceDocs?: Document[];
  }>({
    messages: [
      {
        message: 'Hi, what would you like to learn about this document?',
        type: 'apiMessage',
      },
    ],
    history: [],
  });
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [nameSpace, setNameSpace] = useState<string>();

  const { messages, history } = messageState;

  const messageListRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textAreaRef.current?.focus();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError(null);

    if (!query) {
      alert('Please input a question');
      return;
    }

    const question = query.trim();

    setMessageState((state) => ({
      ...state,
      messages: [
        ...state.messages,
        {
          type: 'userMessage',
          message: question,
        },
      ],
    }));

    setLoading(true);
    setQuery('');

    try {
      // append the file to the form data
      const formData = new FormData();
      if (uploadedFile) {
        formData.append('file', uploadedFile);
      } else {
        throw new Error('No file uploaded - Maybe reload and try again?');
      }
      const isUserFirstMessage = history.length === 0;

      let fileName: string = '';
      let uploadRes;

      console.log('ignoring file upload for now');
      if (isUserFirstMessage && 1 !== 1) {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        console.log('response', response);
        const uploadData = await response.json();

        console.log('uploadData', uploadData);

        if (uploadData.error) {
          throw new Error(uploadData.error);
        }

        setNameSpace(uploadData.nameSpace);
        // not needed anymore
        fileName = uploadData.nameSpace as string;
        uploadRes = uploadData;
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          nameSpace: 'robot copy 5.pdf',
          // nameSpace: !!nameSpace ? nameSpace : uploadRes.nameSpace,
          history,
        }),
      });
      const chatData = await response.json();

      if (chatData.error) {
        setError(chatData.error);
      } else {
        setMessageState((state) => ({
          ...state,
          messages: [
            ...state.messages,
            {
              type: 'apiMessage',
              message: chatData.text,
              sourceDocs: chatData.sourceDocuments,
            },
          ],
          history: [...state.history, [question, chatData.text]],
        }));
      }
      console.log('messageState', messageState);

      setLoading(false);

      //scroll to bottom
      messageListRef.current?.scrollTo(0, messageListRef.current.scrollHeight);
    } catch (error) {
      setLoading(false);
      setError(getErrorMessage(error));
      console.log('error', error);
    }
  }

  //prevent empty submissions
  const handleEnter = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && query) {
      handleSubmit(e as any);
    } else if (e.key == 'Enter') {
      e.preventDefault();
    }
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploadedFile(e.target.files[0]);
    }
  };

  const canUploadAttachment = !loading && !uploadedFile;

  return (
    <>
      <Layout>
        <div className="mx-auto flex flex-col gap-4">
          <div className='w-[75vw]'>
            <h1 className="text-3xl my-6 font-bold leading-[1.1] tracking-tighter text-center">
              {uploadedFile && uploadedFile.name ? (
                <span className="text-blue-600">
                  Chat about the uploaded{' '}
                  <span className="underline">{uploadedFile.name}</span> file
                </span>
              ) : (
                'Chat about any uploaded document'
              )}
            </h1>
            <div className="pl-4">
              <input
                type="file"
                name="file"
                id="file"
                accept='application/pdf'
                className="hidden"
                onChange={handleFileUpload}
                disabled={!canUploadAttachment}
              />
              <label
                htmlFor="file"
                className={`
                flex items-center justify-center 
                w-1/4 px-4 py-2 ${!canUploadAttachment ? 'cursor-not-allowed' : 'cursor-pointer'}
                text-sm font-medium text-white bg-blue-600 border 
                border-transparent rounded-md shadow-sm ${!canUploadAttachment ? 'hover:bg-gray-600' : 'hover:bg-blue-900'}
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
              >
                Upload a document
              </label>
              {uploadedFile && uploadedFile.name ? (
                <p className="text-sm text-gray-500 underline mt-2">
                  {uploadedFile.name} uploaded
                </p>
              ) : null}
            </div>
          </div>
          <main className={styles.main}>
            <div className={styles.cloud}>
              <div ref={messageListRef} className={styles.messagelist}>
                {messages.map((message, index) => {
                  let icon;
                  let className;
                  if (message.type === 'apiMessage') {
                    icon = (
                      <Image
                        key={index}
                        src="/bot-image.png"
                        alt="AI"
                        width="40"
                        height="40"
                        className={styles.boticon}
                        priority
                      />
                    );
                    className = styles.apimessage;
                  } else {
                    icon = (
                      <Image
                        key={index}
                        src="/usericon.png"
                        alt="Me"
                        width="30"
                        height="30"
                        className={styles.usericon}
                        priority
                      />
                    );
                    // The latest message sent by the user will be animated while waiting for a response
                    className =
                      loading && index === messages.length - 1
                        ? styles.usermessagewaiting
                        : styles.usermessage;
                  }
                  return (
                    <div key={`chatMessage-${index}`}>
                      <div className={className}>
                        {icon}
                        <div className={styles.markdownanswer}>
                          <ReactMarkdown linkTarget="_blank">
                            {message.message}
                          </ReactMarkdown>
                        </div>
                      </div>
                      {message.sourceDocs && (
                        <div
                          className="p-5"
                          key={`sourceDocsAccordion-${index}`}
                        >
                          <Accordion
                            type="single"
                            collapsible
                            className="flex-col"
                          >
                            {message.sourceDocs.map((doc, index) => (
                              <div key={`messageSourceDocs-${index}`}>
                                <AccordionItem value={`item-${index}`}>
                                  <AccordionTrigger>
                                    <h3>Source {index + 1}</h3>
                                  </AccordionTrigger>
                                  <AccordionContent>
                                    <ReactMarkdown linkTarget="_blank">
                                      {doc.pageContent}
                                    </ReactMarkdown>
                                    <p className="mt-2">
                                      <b>Source:</b> {doc.metadata.source}
                                    </p>
                                  </AccordionContent>
                                </AccordionItem>
                              </div>
                            ))}
                          </Accordion>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className={styles.center}>
              <div className={styles.cloudform}>
                <form onSubmit={handleSubmit}>
                  <textarea
                    disabled={loading}
                    onKeyDown={handleEnter}
                    ref={textAreaRef}
                    autoFocus={false}
                    rows={1}
                    maxLength={512}
                    id="userInput"
                    name="userInput"
                    placeholder={
                      loading
                        ? 'Waiting for response...'
                        : uploadedFile?.name
                        ? `Ask a question about ${uploadedFile.name}`
                        : 'Upload a document first'
                    }
                    value={query}
                    /* dont set vals, use the form values so we do not rerender at every keystroke */
                    onChange={(e) => setQuery(e.target.value)}
                    className={styles.textarea}
                  />
                  <button
                    type="submit"
                    disabled={loading || !uploadedFile}
                    className={styles.generatebutton}
                  >
                    {loading ? (
                      <div className={styles.loadingwheel}>
                        <LoadingDots color="#000" />
                      </div>
                    ) : (
                      // Send icon SVG in input field
                      <svg
                        viewBox="0 0 20 20"
                        className={styles.svgicon}
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path>
                      </svg>
                    )}
                  </button>
                </form>
              </div>
            </div>
            {error || !uploadedFile ? (
              <div className="border border-red-400 rounded-md p-4">
                <p className="text-red-500">
                  {error ? `${error} - Please try again later or use a different file` : 'Please upload your file first to proceed'}
                </p>
              </div>
            ) : null}
          </main>
        </div>
        <footer className="m-auto p-4 text-xs w-[50vw]">
          Powered by LangChainAI and gpt3-5. Demo built on top of
          <a href="https://twitter.com/mayowaoshin">@mayowaoshin </a> initial
          project and adapted by{' '}
          <a href="https://fer-toasted.vercel.app/" className="text-blue-500">
            esponges
          </a> for the parse & upload to vector store feature.
        </footer>
      </Layout>
    </>
  );
}
