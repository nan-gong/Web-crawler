var React = require('react')
var Component = React.Component;
class Index extends Component{
    render(){
        return <h1>{this.props.name}</h1>
    }
}
module.exports = {
    "Component": function(props){
        return <Index {...props} />
    }
}