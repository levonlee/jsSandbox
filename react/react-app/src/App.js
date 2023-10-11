import logo from './logo.svg';
import './App.css';
import {useEffect, useReducer, useRef, useState} from "react";

function useMyCustomHook(initialValue) {
    const [value, setValue] = useState(initialValue)
    return [
        {
            value,
            onChange: e => setValue(e.target.value)
        },
        // reset to initial value
        () => setValue(initialValue)
    ]
}

function App({library}) {
    // any use* functions are called React hooks

    // State change may trigger re-render
    const [emotion, setEmotion] = useState("Initial Emotion: Happy");
    const [emotionSecondary, setEmotionSecondary] = useState("Initial Secondary Emotion: Happy");

    useEffect(() => {
        console.log(`Create some side-effect e.g. console.log. No dependency means this should only run once.`);
    }, []);

    useEffect(() => {
        console.log(`Emotion is changed to ${emotion}.`);
    }, [emotion]);

    useEffect(() => {
        console.log(`Both Emotion and Secondary Emotion are changed.`);
    }, [emotion, emotionSecondary]);

    const [checked, setChecked] = useState(false);
    // a Reducer function's first argument is bound to the corresponding state
    const [checkedReducer, setCheckedReducer] = useReducer(
        (checked) => !checked,
        false
    );

    // Reference value change does not trigger re-render
    const txtTitle = useRef();

    // An HTML element with `value` as a state but without a `onChange` event is considered as readOnly
    const [hexColor, setHexColor] = useState("#000000");
    const [formTitle, setFormTitle] = useState("My form");

    // formMyName has 2 keys: value and onChange
    const [formMyName, resetFormMyName] =
        useMyCustomHook("My name");

    const submit = (e) => {
        e.preventDefault()
        const title = txtTitle.current.value;
        alert(` title: ${title}, color: ${hexColor}, name: ${formMyName.value}`)
        txtTitle.current.value = "";
        setFormTitle("")
        setHexColor("#000000")
        resetFormMyName()
    }

    const [data,  setData] = useState(null)
    const [error,  setError] = useState(null)
    const [loading,  setLoading] = useState(false)

    useEffect(
        () => {
            setLoading(true)
            fetch(`https://api.github.com/users/moonhighway`)
                .then(
                    (response) => response.json()
                )
                .then(setData)
                .then(() => setLoading(false))
                .catch(setError)
        },
        []
    )

    function GitHubUser({name, location, avatar}) {
        return (
            <div>
                <h1>{name}</h1>
                <p>{location}</p>
                <img src={avatar} height={150} alt={name} />
            </div>
        );
    }

    const myListData = [
        { name: "Item 1" },
        { name: "Item 2" }
    ]

    function MyList({data, renderEmpty, renderItem}) {
        return !data.length
            ? renderEmpty
            : (
                <ul>
                    {data.map((item) => (
                            <li key={item.name}>{renderItem(item)}</li>
                        )
                    )}
                </ul>
            )
    }

    return (
        <div className="App">
            <header className="App-header">
                <img src={logo} className="App-logo" alt="logo" />
                <p>
                    Edit <code>src/App.js</code> and save to reload!
                </p>
                <a
                    className="App-link"
                    href="https://reactjs.org"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    This is {library}.
                </a>
            </header>
            <p>My emotion is {emotion}</p>
            <button onClick={() => setEmotion("sad")}>Sad</button>
            <input
                type="checkbox"
                value={checked}
                onChange={
                    () => setChecked(
                        (checked) => !checked
                    )
                }
            />
            <input
                type="checkbox"
                value={checkedReducer}
                onChange={setCheckedReducer}
            />
            <form onSubmit={submit}>
                <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                />
                <input type="text"
                       {...formMyName}
                />
                <input type="text" ref={txtTitle} />
                <input
                    type="color"
                    value={hexColor}
                    onChange={(e) => setHexColor(e.target.value)}
                />
                <button>ADD</button>
            </form>
            {
                loading
                    ? (
                    <h1>Loading...</h1>
                    )
                    : ""
            }
            {
                data && !error
                    ? (
                        <GitHubUser name={data.name} location={data.location} avatar={data.avatar_url} />
                    )
                    : ""
            }
            {
                error
                    ? (
                        <pre>{JSON.stringify(error)}</pre>
                    )
                    : ""
            }

            <MyList
                data={myListData}
                renderEmpty={<p>This list is empty</p>}
                renderItem={(item) => (
                    <>
                        {item.name}
                    </>
                )}
            />

        </div>
    );
}

export default App;
